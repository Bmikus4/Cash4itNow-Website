#!/usr/bin/env node
// ============================================================================
// THE SESSION GATE. The only sanctioned `git commit` and `git push` in this repo.
// ----------------------------------------------------------------------------
//   node scripts/session.mjs -m "subject" [-F body.txt] [--headline "..."] -- <paths>
//   node scripts/session.mjs --dry-run ...   confirm and print the ticket; write nothing
//   node scripts/session.mjs --push          finish a run whose push failed
//
// Three steps, stopping at the first failure:
//
//   1. Confirm   lint clean, typecheck errors no more than the last ticket's, the full production
//                build (vite, prerender, the five checks) with no fewer pages prerendered than the
//                last ticket, then scripts/measure.mjs on that build, whose own control must see
//                a deliberately slowed copy as slower. Any failure exits non-zero having written
//                NOTHING.
//   2. Ticket    One line appended to feed/feed.jsonl: the numbers as they stood, a headline.
//                Never rewritten, never deleted. A number that moves between two tickets is
//                explained by the later one or it is a regression.
//   3. Commit    The named paths and the feed, by pathspec, the message checked against
//                scripts/commit-standard.mjs BEFORE anything runs, then pushed to the current
//                branch. The pre-push hook refuses any tip without a ticket.
//
// The ticket carries no sha: it is committed inside the commit it would name. The ticket id in
// the message is the join key:   git log --grep "Ticket W-20261021T190000Z"
//
// WHY THE WORKING TREE MUST HOLD NOTHING BUT THE NAMED PATHS. What is built and measured is the
// working tree. A stray edit elsewhere would be confirmed, then left out of the commit, and the
// ticket would vouch for a state no commit holds. So any change outside the named paths stops
// the gate before it starts, and the named files are hashed before the confirm and again before
// the commit, so an edit made while the measurement ran is refused too.
//
// WHY THE PUSH IS TO THE CURRENT BRANCH AND MAIN NEEDS --prod. A push to main is a production
// deploy, and that is Ben's call each time. Work is gated on `lead-capture` (a Vercel preview);
// production is then `git push origin lead-capture:main`, which the hook lets through only
// because the tip is already ticketed. --prod exists for the day work is gated on main itself.
//
// Proving it fails closed: break a file under src/ and run it (red at lint or build), and run it
// with WEB_GATE_INVERT_CONTROL=1 (red at the control). Both must leave the feed untouched.
// ============================================================================
import { execFileSync, execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { checkCommitMessage } from "./commit-standard.mjs";
import { measureAll } from "./measure.mjs";

const ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const FEED_PATH = "feed/feed.jsonl";
const FEED = join(ROOT, FEED_PATH);
const CO_AUTHOR = "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>";
const TICKET = /^Ticket W-\d{8}T\d{6}Z$/m;

const git = (args, opts = {}) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();

function die(step, detail = "", written = false) {
  console.error(`\nGATE FAILED at ${step}.${written ? "" : " Nothing was written."}`);
  if (detail) console.error(String(detail).slice(-4000));
  process.exit(1);
}

function parseArgs(argv) {
  const a = { message: null, bodyFile: null, headline: null, dryRun: false, prod: false, pushOnly: false, paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--") { a.paths.push(...argv.slice(i + 1)); break; }
    if (k === "-m" || k === "--message") a.message = argv[++i];
    else if (k === "-F" || k === "--body-file") a.bodyFile = argv[++i];
    else if (k === "--headline") a.headline = argv[++i];
    else if (k === "--dry-run") a.dryRun = true;
    else if (k === "--prod") a.prod = true;
    else if (k === "--push") a.pushOnly = true;
    else a.paths.push(k);
  }
  a.paths = a.paths.map((p) => p.replace(/\\/g, "/").replace(/\/+$/, ""));
  return a;
}

/** "W-20261021T190000Z": the UTC second the ticket was written. */
const ticketId = (d = new Date()) => `W-${d.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;

const within = (p, roots) => roots.some((r) => r === "." || p === r || p.startsWith(`${r}/`));

/** Every changed or untracked path in the working tree, as git spells it. */
function dirty() {
  // Not through git(): its trim() eats the status column's leading space, and the first path
  // then reads "rc/main.jsx".
  const raw = execFileSync("git", ["status", "--porcelain=v1", "-z", "-uall"], { cwd: ROOT, encoding: "utf8" });
  const parts = raw.split("\0").filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const xy = parts[i].slice(0, 2);
    out.push({ path: parts[i].slice(3), untracked: xy === "??", deleted: xy.includes("D") });
    if (/[RC]/.test(xy)) i++;
  }
  return out;
}

const fingerprint = (entries) =>
  entries.map((e) => `${e.path}:${e.deleted || !existsSync(join(ROOT, e.path)) ? "deleted" : git(["hash-object", "--", e.path])}`).join("\n");

/** npm script output, or the gate stops at `step` with the tail of what it printed. */
function npm(step, script) {
  try {
    return execSync(`npm run -s ${script}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
  } catch (e) {
    if (step) die(step, `${e.stdout ?? ""}${e.stderr ?? ""}`);
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
}

function lastTicket() {
  if (!existsSync(FEED)) return null;
  const lines = readFileSync(FEED, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.length ? JSON.parse(lines.at(-1)) : null;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.pushOnly) return pushOnly(a);
  if (!a.message) die("arguments", 'usage: node scripts/session.mjs -m "subject" [-F body.txt] [--headline "..."] -- <paths>');
  if (!a.paths.length) die("arguments", "name the paths to commit after `--`; a commit takes only what it names");
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "HEAD") die("arguments", "HEAD is detached; check out the branch to push");
  if (branch === "main" && !a.prod) die("arguments", "a push to main is a production deploy and needs Ben's go each time; gate on lead-capture, or pass --prod when he has said yes");

  const changes = dirty().filter((e) => e.path !== FEED_PATH);
  const outside = changes.filter((e) => !within(e.path, a.paths));
  if (outside.length) die("working tree", `these would be built and measured but left out of the commit; name them, or set them aside:\n  ${outside.map((e) => e.path).join("\n  ")}`);
  const named = changes.filter((e) => within(e.path, a.paths));
  if (!named.length) die("arguments", "the named paths change nothing against HEAD");

  const body = a.bodyFile ? readFileSync(a.bodyFile, "utf8").trim() : "";
  const tracked = git(["diff", "--numstat", "HEAD", "--", ...a.paths]).split(/\r?\n/).filter(Boolean)
    .reduce((s, l) => s + (Number(l.split("\t")[0]) || 0) + (Number(l.split("\t")[1]) || 0), 0);
  const added = named.filter((e) => e.untracked).reduce((s, e) => s + readFileSync(join(ROOT, e.path), "utf8").split("\n").length, 0);
  const violations = checkCommitMessage({ message: [a.message, body].filter(Boolean).join("\n\n"), filesChanged: named.length, linesChanged: tracked + added });
  if (violations.length) die("commit standard", violations.map((v) => `${v.rule}: ${v.detail}`).join("\n"));

  const before = fingerprint(named);
  const last = lastTicket();
  console.error(`confirm: ${named.length} files on ${branch}`);

  npm("lint", "lint");
  console.error("lint: clean");

  const typecheck = (npm(null, "typecheck").match(/error TS\d+/g) ?? []).length;
  const tcBefore = last?.confirm?.typecheck_errors;
  if (tcBefore != null && typecheck > tcBefore) die("typecheck", `${typecheck} errors, up from ${tcBefore} at ${last.id}`);
  console.error(`typecheck: ${typecheck} errors${tcBefore != null ? ` (last ticket ${tcBefore})` : ""}`);

  const build = npm("build", "build");
  const prerendered = Number(build.match(/PRERENDER: (\d+) snapshotted/)?.[1] ?? NaN);
  if (!Number.isFinite(prerendered)) die("build", `the prerender did not report; a skipped prerender ships pages crawlers cannot read\n${build}`);
  const preBefore = last?.confirm?.prerendered;
  if (preBefore != null && prerendered < preBefore) die("build", `${prerendered} pages prerendered, down from ${preBefore} at ${last.id}`);
  console.error(`build: ${prerendered} pages prerendered`);

  let measured;
  try {
    measured = await measureAll({ log: (l) => console.error(`  ${l}`) });
  } catch (e) {
    die(e.step ?? "measure", e.message);
  }

  if (fingerprint(named) !== before) die("integrity", "a named file changed while the gate ran; what was measured is not what would be committed. Run it again.");

  const entry = {
    id: ticketId(),
    ts: new Date().toISOString(),
    branch,
    headline: a.headline || a.message,
    subject: a.message,
    confirm: { lint: "clean", typecheck_errors: typecheck, prerendered, prerender_skipped: Number(build.match(/(\d+) left client-rendered/)?.[1] ?? 0) },
    measured,
  };
  if (a.dryRun) { console.log(JSON.stringify(entry, null, 1)); console.error("--dry-run: nothing written"); return; }

  const feedBefore = existsSync(FEED) ? readFileSync(FEED, "utf8") : null;
  mkdirSync(dirname(FEED), { recursive: true });
  appendFileSync(FEED, `${JSON.stringify(entry)}\n`);
  const msgDir = mkdtempSync(join(tmpdir(), "web-session-msg-"));
  const msgFile = join(msgDir, "message.txt");
  writeFileSync(msgFile, `${[a.message, body].filter(Boolean).join("\n\n")}\n\n${entry.headline}\n\nTicket ${entry.id}\n\n${CO_AUTHOR}\n`);
  try {
    // Staged first: `git commit -- <path>` refuses a path git has never seen, and the feed and
    // any new file start that way.
    git(["add", "-A", "--", ...a.paths, FEED_PATH]);
    git(["commit", "-q", "-F", msgFile, "--", ...a.paths, FEED_PATH]);
  } catch (e) {
    try { git(["restore", "--staged", "--", ...a.paths, FEED_PATH]); } catch { /* nothing staged */ }
    if (feedBefore === null) rmSync(FEED, { force: true }); else writeFileSync(FEED, feedBefore);
    die("commit", `${e.stdout ?? ""}${e.stderr ?? ""}`);
  } finally {
    rmSync(msgDir, { recursive: true, force: true });
  }
  console.error(`ticket ${entry.id}: ${git(["log", "-1", "--oneline"])}`);
  push(branch);
}

function push(branch) {
  try {
    execFileSync("git", ["push", "origin", `HEAD:refs/heads/${branch}`], { cwd: ROOT, stdio: "inherit" });
    console.error(`pushed to ${branch}`);
  } catch {
    die("push", "the commit is local and ticketed; fix what the output above names, then `node scripts/session.mjs --push`.", true);
  }
}

function pushOnly(a) {
  if (!TICKET.test(git(["log", "-1", "--format=%B"]))) die("push", "HEAD carries no ticket; run the gate on your paths instead");
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "main" && !a.prod) die("push", "a push to main is a production deploy and needs Ben's go; pass --prod when he has said yes");
  push(branch);
}

await main();
