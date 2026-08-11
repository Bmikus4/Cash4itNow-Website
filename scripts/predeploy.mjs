/**
 * PRE-DEPLOY PACK — everything about this site's readiness that can be decided
 * offline, run as one set.
 *
 * WHY IT EXISTS. Ben's plan is ONE deliberate deploy at the end. That single run
 * is the first time F7, the platform's origin allowlist and the whole lead seam
 * are ever exercised for real, and the site has never been deployed at all — so
 * every gate here has only ever been checked against a tree, never against
 * Vercel. The gates individually are good. What was missing is a thing that runs
 * them TOGETHER and re-proves each one still bites: a gate nobody re-runs is a
 * gate that has stopped existing, and this repo has already shipped one
 * "assertion" that turned out to be a grep somebody ran once and wrote down.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not try to guess at anything that
 * needs the network, a database, or a real Vercel edge. Those are enumerated in
 * fleet/drops/c4in-deploy-checklist.md as the list the one deploy gets spent
 * proving. A pack that reported PASS on the CORS round trip from a tree would be
 * lying, and the lie would be discovered on the one run where it costs the most.
 *
 * IT MUST FAIL ON AN UNREADY TREE. A pack that passes on a tree that is not
 * ready is checking nothing.
 *
 * Usage:  node scripts/predeploy.mjs [--quick]
 *   --quick  skips the two full builds (determinism) and the negative tests,
 *            leaving only the static coherence checks. For iterating. NEVER the
 *            thing you run before the deploy.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { routesFromApp, postExpansions, outputPathFor } from "./prerender/lib.mjs";
import { POSTS } from "../src/content/posts.js";
import { resolveOrigins } from "../src/lib/origins.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const QUICK = process.argv.includes("--quick");
const PLATFORM = "C:/code/cash4itnow-platform";

const results = [];
const record = (status, name, detail, why) => results.push({ status, name, detail, why });
const pass = (name, detail) => record("PASS", name, detail);
const fail = (name, detail, why) => record("FAIL", name, detail, why);
const blocked = (name, detail, why) => record("BLOCKED", name, detail, why);
const skip = (name, detail) => record("SKIP", name, detail);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readDist = (rel) => fs.readFileSync(path.join(DIST, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(DIST, rel));

/** vite only. The negative tests all fail at buildStart, so the crawl never runs. */
function viteBuild() {
  try {
    execFileSync("npx", ["vite", "build"], { cwd: ROOT, stdio: "pipe", shell: true });
    return { code: 0, output: "" };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

function fullBuild() {
  try {
    execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "pipe", shell: true });
    return { code: 0, output: "" };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

// ---------------------------------------------------------------------------
// 0. Refuse to run on a dirty tree.
//
// The negative tests below deliberately break files and restore them. On a clean
// tree any residue from a crash is visible in `git status` and recoverable with
// `git checkout`. On a dirty tree it is indistinguishable from real work, and
// this script would become the thing that ate it.
// ---------------------------------------------------------------------------
let treeClean = false;
try {
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).trim();
  treeClean = status === "";
  if (treeClean) pass("clean tree", "no uncommitted changes, so a crashed negative test is recoverable");
  else blocked("clean tree", `uncommitted changes present`, "negative tests mutate files and restore them; on a dirty tree a crash is indistinguishable from your own work, so they are skipped");
} catch {
  blocked("clean tree", "git not available", "cannot guarantee recovery, so negative tests are skipped");
}

// ---------------------------------------------------------------------------
// 1. ORIGIN COHERENCE, END TO END. F7's exact shape, and it has recurred twice —
//    once as leadClient's literal, once as robots.txt's Sitemap line. Every
//    place an origin is written or emitted must name the same one.
// ---------------------------------------------------------------------------
const { api, site, connectOrigins } = resolveOrigins(process.env);

{
  const vercel = JSON.parse(read("vercel.json"));
  const csp = vercel.headers?.flatMap((h) => h.headers ?? []).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
  const connectSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("connect-src")) ?? "";
  const missing = connectOrigins.filter((o) => !connectSrc.includes(o));
  if (missing.length) fail("origin: CSP connect-src", `missing ${missing.join(", ")}`, "the browser blocks every lead POST and every sales GET, and img-src https: keeps the page looking alive — this is F7 itself");
  else pass("origin: CSP connect-src", `allows ${connectOrigins.join(", ")}`);
}

{
  const robots = read("public/robots.txt");
  const line = robots.match(/^\s*Sitemap:\s*(\S+)\s*$/im)?.[1];
  if (!line) skip("origin: robots.txt Sitemap", "no Sitemap line, which is a documented valid choice");
  else if (line === `${site}/sitemap.xml`) pass("origin: robots.txt Sitemap", line);
  else fail("origin: robots.txt Sitemap", `${line} != ${site}/sitemap.xml`, "every crawler fetches a sitemap on a host we do not serve and indexes nothing from it");
}

{
  const html = read("index.html");
  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1];
  if (!ogImage) skip("origin: index.html og:image", "no static og:image");
  else if (ogImage.startsWith(`${site}/`)) pass("origin: index.html og:image", ogImage);
  else fail("origin: index.html og:image", `${ogImage} is not on ${site}`, "a scraper caches what it fetched, so a broken preview outlives the fix by weeks");
}

{
  const literals = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && full !== path.join(ROOT, "src/lib/origins.js")) {
        const code = fs.readFileSync(full, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
        for (const origin of [api, site]) if (code.includes(origin)) literals.push(path.relative(ROOT, full));
      }
    }
  };
  walk(path.join(ROOT, "src"));
  if (literals.length) fail("origin: no literals under src/", literals.join(", "), "a literal survives a change to VITE_API_ORIGIN and sends requests to a host the CSP no longer allows, while the build stays green");
  else pass("origin: no literals under src/", "src/lib/origins.js is the only file spelling one out");
}

if (exists("sitemap.xml")) {
  const locs = [...readDist("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const off = locs.filter((u) => !u.startsWith(`${site}/`));
  if (off.length) fail("origin: sitemap <loc> entries", `${off.length} not on ${site}`, "we would be submitting URLs on a host we do not serve");
  else pass("origin: sitemap <loc> entries", `${locs.length} URLs, all on ${site}`);
} else blocked("origin: sitemap <loc> entries", "dist/sitemap.xml missing", "run a build first");

// ---------------------------------------------------------------------------
// 2. ROUTE COHERENCE. App.jsx is the single source; vercel.json and the crawl
//    derive from it. The terminal catch-all must stay LAST, or an unknown URL
//    stops reaching the branded 404 that carries the phone number.
// ---------------------------------------------------------------------------
const app = read("src/App.jsx");
const { static: staticRoutes, dynamic } = routesFromApp(app, postExpansions(POSTS));
const rewrites = JSON.parse(read("vercel.json")).rewrites ?? [];

{
  const covering = new Set(
    rewrites.filter((r) => r.destination === "/index.html" || /^\/[\w./-]+\/index\.html$/.test(r.destination)).map((r) => r.source)
  );
  const missing = [...staticRoutes, ...dynamic].filter((r) => !covering.has(r));
  if (missing.length) fail("routes: every route has a rewrite", missing.join(", "), "those routes work in dev and 404 in production, with nothing failing loudly in between");
  else pass("routes: every route has a rewrite", `${staticRoutes.length} static + ${dynamic.length} dynamic, all covered`);
}

{
  const last = rewrites[rewrites.length - 1];
  const catchAlls = rewrites.filter((r) => r.source === "/(.*)");
  if (!catchAlls.length) fail("routes: branded 404 reachable", "no terminal /(.*) rule", "an unknown URL gets Vercel's own 404 instead of our page with the phone number on it — a foreign 404 costs a lead");
  else if (last?.source !== "/(.*)") fail("routes: terminal catch-all is last", `last rule is ${last?.source}`, "a rule after the catch-all is unreachable, and if the catch-all moved up it swallows real routes");
  else if (!exists("404.html")) fail("routes: branded 404 reachable", "dist/404.html missing", "the terminal rule points at a file that does not exist");
  else pass("routes: terminal catch-all is last", "/(.*) -> /404.html, and dist/404.html exists");
}

{
  // Only /index.html-destined rules count as coverage; the 404 rule must never
  // read as a catch-all or the route gate passes for every missing route.
  const bad = rewrites.filter((r) => r.source !== "/(.*)" && r.destination === "/404.html");
  if (bad.length) fail("routes: no route hides behind the 404 rule", bad.map((r) => r.source).join(", "), "a route pointed at /404.html looks covered and serves the error page");
  else pass("routes: no route hides behind the 404 rule", "only the terminal rule targets /404.html");
}

// ---------------------------------------------------------------------------
// 3. PRERENDER COMPLETENESS. The count is DERIVED from the route list. A literal
//    here would be the one-thing-two-representations defect in the checker
//    itself, and would keep passing after a route was added.
// ---------------------------------------------------------------------------
{
  const shell = exists("index.html") ? fs.readFileSync(path.join(DIST, "index.html")) : null;
  const bad = [];
  let shells = 0;
  for (const route of staticRoutes) {
    const rel = outputPathFor(route);
    if (!exists(rel)) { bad.push(`${route}: no file`); continue; }
    const buf = fs.readFileSync(path.join(DIST, rel));
    if (shell && buf.equals(shell)) { shells++; continue; }
    const html = buf.toString("utf8");
    const missing = [
      /<title>[^<]+<\/title>/.test(html) ? null : "title",
      /name="description"\s+content="[^"]+"/.test(html) ? null : "description",
      new RegExp(`property="og:url"\\s+content="${site}${route === "/" ? "/" : route}"`).test(html) ? null : "og:url",
      /rel="canonical"/.test(html) ? null : "canonical",
    ].filter(Boolean);
    if (missing.length) bad.push(`${route}: no ${missing.join(", ")}`);
  }
  if (bad.length) fail("prerender: every static route is real HTML", bad.join(" | "), "a crawler or an AI assistant reads the site default for those routes, which is the defect prerendering exists to fix");
  else if (shells === staticRoutes.length) blocked("prerender: every static route is real HTML", `all ${staticRoutes.length} routes are shell copies`, "the crawl degraded — the site still works but ships no per-route text; find out why before spending the deploy");
  else if (shells) fail("prerender: every static route is real HTML", `${shells} of ${staticRoutes.length} are shell copies`, "a partial crawl means some routes silently lost their tags; a deploy would bake that in");
  else pass("prerender: every static route is real HTML", `${staticRoutes.length}/${staticRoutes.length} routes, count derived from src/App.jsx`);
}

{
  // /sale/:slug is the one route that CANNOT go static yet, and that is correct.
  if (dynamic.length) pass("prerender: dynamic routes stay client-rendered", `${dynamic.join(", ")} — correct until Phase 1, since a snapshot today would bake the not-found title into a static file`);
  else skip("prerender: dynamic routes stay client-rendered", "none");
}

// ---------------------------------------------------------------------------
// 4. THE PLATFORM'S ORIGIN ALLOWLIST. Read-only, and reported rather than acted
//    on — it is another terminal's repo. This is the mirror half of F7: our CSP
//    can be perfect and the browser still blocks the response if the platform
//    does not name our origin back.
// ---------------------------------------------------------------------------
{
  const routeFile = path.join(PLATFORM, "apps/admin/app/api/public/lead/route.ts");
  if (!fs.existsSync(routeFile)) {
    blocked("platform: PUBLIC_FORM_ORIGINS names this site", "platform repo not readable from here", "confirm on the day that the deployed platform allows this site's origin, or every form reports a network failure indistinguishable from a dead endpoint");
  } else {
    const defaults = fs.readFileSync(routeFile, "utf8").match(/PUBLIC_FORM_ORIGINS\s*\?\?\s*'([^']+)'/)?.[1];
    const list = defaults ? defaults.split(",").map((s) => s.trim()) : null;
    if (!list) blocked("platform: PUBLIC_FORM_ORIGINS names this site", "could not parse the compiled-in default", "its shape changed, so this check is stale and must be fixed before it is trusted");
    else if (list.includes(site)) pass("platform: PUBLIC_FORM_ORIGINS names this site", `compiled-in default [${list.join(", ")}] includes ${site}`);
    else fail("platform: PUBLIC_FORM_ORIGINS names this site", `compiled-in default [${list.join(", ")}] does not include ${site}`, "the browser blocks the response and the form reports a network failure — on the one run whose purpose is deciding whether the endpoint is alive. NOT ours to fix: report it to the platform terminal");
  }
}

// ---------------------------------------------------------------------------
// 5. DETERMINISM + 6. EVERY GATE STILL BITES.
// ---------------------------------------------------------------------------
if (QUICK) {
  skip("determinism across two builds", "--quick");
  skip("every gate still fails when broken", "--quick");
} else {
  const first = fullBuild();
  if (first.code !== 0) {
    fail("build", `npm run build exited ${first.code}`, "nothing below can be trusted until the build is green");
  } else {
    const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), "predeploy-"));
    const emitted = [];
    const collect = (dir, base = "") => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) collect(full, rel);
        else if (/(index\.html|sitemap\.xml|404\.html)$/.test(entry.name)) emitted.push(rel);
      }
    };
    collect(DIST);
    for (const rel of emitted) {
      fs.mkdirSync(path.join(snapshot, path.dirname(rel)), { recursive: true });
      fs.copyFileSync(path.join(DIST, rel), path.join(snapshot, rel));
    }

    const second = fullBuild();
    if (second.code !== 0) {
      fail("determinism across two builds", `second build exited ${second.code}`, "a build that is not repeatable cannot be verified before it is deployed");
    } else {
      const differing = emitted.filter((rel) => !fs.readFileSync(path.join(DIST, rel)).equals(fs.readFileSync(path.join(snapshot, rel))));
      if (differing.length) fail("determinism across two builds", `${differing.length} of ${emitted.length} files differ: ${differing.slice(0, 4).join(", ")}`, "what you verified is not what deploys; the usual causes are a live countdown, a Date.now()-relative date, or a new infinite animation missing data-loop-animation");
      else pass("determinism across two builds", `${emitted.length} emitted files byte-identical`);
    }
    fs.rmSync(snapshot, { recursive: true, force: true });
  }

  // Each gate is re-proved by breaking the thing it guards and requiring a
  // non-zero exit. Restoration is guaranteed in `finally` and then VERIFIED,
  // because a restore that silently failed would leave the repo broken by the
  // very script meant to protect it.
  if (!treeClean) {
    skip("every gate still fails when broken", "tree not clean");
  } else {
    const probe = path.join(ROOT, "src/__predeploy_origin_probe.js");
    const NEGATIVES = [
      {
        gate: "route list gate",
        file: "vercel.json",
        mutate: (text) => JSON.stringify({ ...JSON.parse(text), rewrites: JSON.parse(text).rewrites.filter((r) => r.source !== "/about") }, null, 2),
      },
      {
        gate: "CSP connect-src gate",
        file: "vercel.json",
        mutate: (text) => text.replace(` ${api}`, ""),
      },
      {
        gate: "og:image gate",
        file: "index.html",
        mutate: (text) => text.replace(`${site}/share.jpg`, "https://example.invalid/share.jpg"),
      },
      {
        gate: "robots.txt Sitemap gate",
        file: "public/robots.txt",
        mutate: (text) => text.replace(`${site}/sitemap.xml`, "https://example.invalid/sitemap.xml"),
      },
      {
        gate: "origin literal gate",
        create: probe,
        content: `export const stray = "${api}";\n`,
      },
    ];

    const broken = [];
    for (const negative of NEGATIVES) {
      let backup = null;
      const target = negative.file ? path.join(ROOT, negative.file) : negative.create;
      try {
        if (negative.file) {
          backup = fs.readFileSync(target);
          fs.writeFileSync(target, negative.mutate(backup.toString("utf8")));
        } else {
          fs.writeFileSync(target, negative.content);
        }
        if (viteBuild().code === 0) broken.push(negative.gate);
      } finally {
        if (negative.file) fs.writeFileSync(target, backup);
        else fs.rmSync(target, { force: true });
      }
    }

    // Restoration is verified, not assumed.
    const after = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).trim();
    if (after !== "") {
      fail("negative tests restored the tree", after.split("\n").join(" | "), "THE TREE IS DIRTY AND THIS SCRIPT DID IT — run `git checkout -- .` and delete src/__predeploy_origin_probe.js if present");
    } else if (broken.length) {
      fail("every gate still fails when broken", `${broken.join(", ")} did NOT fail`, "that gate has stopped existing; the defect it guards can now ship with a green build");
    } else {
      pass("every gate still fails when broken", `${NEGATIVES.length} gates re-proved, tree restored and verified clean`);
      // The dist-only checks are cheap and mutate nothing the repo tracks.
      const sitemapPath = path.join(DIST, "sitemap.xml");
      if (fs.existsSync(sitemapPath)) {
        const original = fs.readFileSync(sitemapPath);
        try {
          fs.writeFileSync(sitemapPath, original.toString("utf8").replace(/\n\s*<url><loc>[^<]*<\/loc><\/url>/, ""));
          let sitemapBit = false;
          try { execFileSync("node", ["scripts/check-sitemap.mjs"], { cwd: ROOT, stdio: "pipe" }); } catch { sitemapBit = true; }
          if (sitemapBit) pass("sitemap check still fails when broken", "a removed <loc> is detected");
          else fail("sitemap check still fails when broken", "a removed <loc> went unnoticed", "the sitemap could drift from the routes and nothing would say so");
        } finally {
          fs.writeFileSync(sitemapPath, original);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const width = Math.max(...results.map((r) => r.name.length));
process.stdout.write("\nPRE-DEPLOY PACK\n");
process.stdout.write(`${"-".repeat(width + 60)}\n`);
for (const r of results) {
  process.stdout.write(`${r.status.padEnd(8)} ${r.name.padEnd(width)}  ${r.detail}\n`);
  if (r.why) process.stdout.write(`${" ".repeat(9 + width)}  why: ${r.why}\n`);
}

const failures = results.filter((r) => r.status === "FAIL");
const blocks = results.filter((r) => r.status === "BLOCKED");
process.stdout.write(`${"-".repeat(width + 60)}\n`);
process.stdout.write(
  `${results.filter((r) => r.status === "PASS").length} pass · ${failures.length} fail · ` +
    `${blocks.length} blocked · ${results.filter((r) => r.status === "SKIP").length} skipped\n`
);
process.stdout.write(
  failures.length
    ? "\nNOT READY. Every FAIL above is decidable from this tree, so none of them needs a deploy to settle.\n"
    : "\nEverything decidable offline is green. What remains cannot be settled from a tree —\n" +
      "see fleet/drops/c4in-deploy-checklist.md for what the one deploy is being spent to prove.\n"
);
process.exitCode = failures.length ? 1 : 0;
