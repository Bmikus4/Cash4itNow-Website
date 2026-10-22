#!/usr/bin/env node
// ============================================================================
// THE SPEED MEASUREMENT the session gate tickets, also runnable on its own while working:
//
//   node scripts/measure.mjs                     dist/, served the way Vercel serves it
//   node scripts/measure.mjs --base https://www.cash4itnow.com   the live site, same pages
//   node scripts/measure.mjs --runs 1            quicker, noisier
//
// Lighthouse (pinned below) with its default simulated throttling, so a phone number is a
// mid-range phone on slow 4G whatever this machine is. Each page and device runs RUNS times and
// the run with the median performance score is reported whole, so the metrics in one row belong
// to one load rather than being medians from different loads.
//
// WHY A SERVER OF ITS OWN AND NOT `vite preview`. The numbers are only comparable with production
// if the bytes and routes are production's: Vercel serves the file system first, then the
// vercel.json rewrites (so `/nope` is 404.html with status 200), sends its headers (the CSP
// decides which API calls the page may make) and compresses with brotli. vite preview does none of
// that. What this server still cannot copy is HTTP/2, so request-heavy pages read somewhat worse
// here than live; compare tickets with tickets, and `--base` with `--base`.
//
// THE CONTROL. A measurement that cannot see a slower page measures nothing. Every local run also
// loads Home on a phone from a second server that holds every response for CONTROL_DELAY_MS, and
// refuses the whole measurement unless that copy's first paint comes out at least half that later.
// Per-response delay rather than a slow document alone, because Lighthouse's simulator estimates
// server time per ORIGIN from all of its requests, and one slow document among fifty fast assets
// disappears in that estimate. WEB_GATE_INVERT_CONTROL=1 turns the delay off, which must fail.
// ============================================================================
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { brotliCompressSync } from "node:zlib";
import { resolveOrigins } from "../src/lib/origins.js";

const ROOT = join(import.meta.dirname, "..");
const API = resolveOrigins(process.env).connectOrigins;
export const LIGHTHOUSE = "12.8.2";
const RUNS = 3;
const CONTROL_DELAY_MS = 1000;
const PAGES = [
  { name: "home", path: "/", file: "index.html" },
  { name: "shop", path: "/shop", file: "shop/index.html" },
];
const DEVICES = ["phone", "desktop"];
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
};
const COMPRESS = new Set([".html", ".js", ".css", ".json", ".svg", ".xml", ".txt", ".webmanifest"]);
const brotli = new Map();

const pattern = (source) => new RegExp(`^${source.replace(/:(\w+)/g, "[^/]+")}$`);

/** dist/ served as Vercel serves it. `docs` records which file answered each page load. */
export function serve(dir, { delayMs = 0 } = {}) {
  const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
  const redirects = (vercel.redirects ?? []).map((r) => [pattern(r.source), r.destination, r.permanent ? 308 : 307]);
  const rewrites = (vercel.rewrites ?? []).map((r) => [pattern(r.source), r.destination]);
  const headers = (vercel.headers ?? []).map((h) => [pattern(h.source), h.headers]);
  const docs = [];
  // Compressed before the server listens. Done on first request instead, brotli on the 594 KB
  // bundle blocked this process for about 1.2 s, every response queued behind it, and Lighthouse's
  // simulator, which estimates server time per origin from what it observed, charged that stall
  // to the site (the first load of each gate ran slow, ticket W-20261022T013706Z).
  for (const rel of readdirSync(dir, { recursive: true })) {
    const abs = join(dir, rel);
    if (!COMPRESS.has(extname(abs)) || !statSync(abs).isFile()) continue;
    const key = `${abs}:${statSync(abs).mtimeMs}`;
    if (!brotli.has(key)) brotli.set(key, brotliCompressSync(readFileSync(abs)));
  }
  const find = (rel) => {
    const abs = join(dir, rel);
    if (!existsSync(abs)) return null;
    if (statSync(abs).isFile()) return rel;
    return existsSync(join(abs, "index.html")) ? join(rel, "index.html").replace(/\\/g, "/") : null;
  };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://local").pathname);
    const answer = () => {
      for (const [re, to, code] of redirects) if (re.test(path)) { res.writeHead(code, { location: to }); res.end(); return; }
      let rel = find(path.slice(1));
      if (!rel) for (const [re, to] of rewrites) if (re.test(path)) { rel = find(to.slice(1)); break; }
      if (!rel) { res.writeHead(404); res.end(); return; }
      const ext = extname(rel);
      const out = { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=0, must-revalidate" };
      for (const [re, list] of headers) if (re.test(path)) for (const h of list) out[h.key.toLowerCase()] = h.value;
      let body = readFileSync(join(dir, rel));
      const packed = brotli.get(`${join(dir, rel)}:${statSync(join(dir, rel)).mtimeMs}`);
      if (packed && /\bbr\b/.test(req.headers["accept-encoding"] ?? "")) {
        body = packed;
        out["content-encoding"] = "br";
      }
      if (ext === ".html") docs.push({ path, file: rel });
      res.writeHead(200, out);
      res.end(body);
    };
    if (delayMs) setTimeout(answer, delayMs); else answer();
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({
    base: `http://127.0.0.1:${server.address().port}`, docs, close: () => new Promise((r) => server.close(r)),
  })));
}

const run = promisify(exec);

/**
 * The pinned CLI's path inside npx's cache, found once. Letting npx resolve it on every load cost
 * about ten seconds a run, two minutes a gate.
 */
async function lighthouseCli() {
  await run(`npx -y lighthouse@${LIGHTHOUSE} --version`);
  const cache = join((await run("npm config get cache")).stdout.trim(), "_npx");
  for (const d of readdirSync(cache)) {
    const pkg = join(cache, d, "node_modules", "lighthouse");
    if (existsSync(join(pkg, "package.json")) && JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).version === LIGHTHOUSE) return join(pkg, "cli", "index.js");
  }
  throw new Error(`lighthouse ${LIGHTHOUSE} is not in npx's cache after installing it`);
}

let cli = null;

/** One Lighthouse load. Async on purpose: the server answering it lives in this process. */
async function lighthouse(url, device, scratch, n) {
  cli ??= await lighthouseCli();
  const out = join(scratch, `lh-${n}.json`);
  const cmd = [
    `"${process.execPath}" "${cli}" "${url}"`, `--output=json --output-path="${out}" --quiet`,
    "--only-categories=performance,accessibility,best-practices,seo",
    // --disable-web-security because the platform's CORS allows only www.cash4itnow.com. Without
    // it every sales and catalog fetch from 127.0.0.1 was refused, and the first three tickets
    // measured /shop's "Nothing listed" panel and a Home with no ribbon. It lifts CORS, not the
    // CSP, so the page can still reach only the origins production allows.
    `--chrome-flags="--headless=new --no-first-run --disable-extensions --disable-web-security"`,
    device === "desktop" ? "--preset=desktop" : "",
  ].join(" ");
  try {
    await run(cmd, { env: { ...process.env, CHROME_PATH: CHROME }, timeout: 240_000, maxBuffer: 1 << 24 });
  } catch (e) {
    // On Windows chrome-launcher can fail to delete its profile directory after the report is
    // written, and exits non-zero for it. A report on disk is the run; no report is the failure.
    if (!existsSync(out)) throw new Error(`lighthouse ${url} (${device}): ${String(e.stderr || e.message).trim().split(/\r?\n/).pop()}`);
  }
  return JSON.parse(readFileSync(out, "utf8"));
}

function summary(lhr) {
  const a = lhr.audits;
  const ms = (id) => Math.round(a[id].numericValue);
  const score = (id) => Math.round(lhr.categories[id].score * 100);
  return {
    perf: score("performance"), a11y: score("accessibility"), bp: score("best-practices"), seo: score("seo"),
    fcp_ms: ms("first-contentful-paint"), lcp_ms: ms("largest-contentful-paint"), si_ms: ms("speed-index"),
    tbt_ms: ms("total-blocking-time"), cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
    kb: Math.round(a["total-byte-weight"].numericValue / 1024),
  };
}

/** Refuses a load that did not measure the page it names. */
function checkLoad(lhr, page, served) {
  if (lhr.runtimeError) throw new Error(`${page.path}: Lighthouse ${lhr.runtimeError.code}: ${lhr.runtimeError.message}`);
  if (lhr.categories.performance.score == null) throw new Error(`${page.path}: no performance score`);
  const doc = lhr.audits["network-requests"]?.details?.items?.find((i) => i.resourceType === "Document");
  if (doc?.statusCode !== 200) throw new Error(`${page.path}: the document answered ${doc?.statusCode ?? "nothing"}`);
  if (served && served !== page.file) throw new Error(`${page.path}: the server answered with ${served}, not ${page.file}`);
  // Every data request to the platform, not only fetches: a preloaded one reports as "Other". The
  // image route is left out because the hero ribbon rebuilds its rows and cancels photographs in
  // flight (status -1), which failed a gate on a page that had all its data.
  const data = lhr.audits["network-requests"].details.items.filter((i) => API.some((o) => i.url.startsWith(o)) && !i.url.includes("/catalog/image/"));
  const failed = data.filter((i) => !(i.statusCode >= 200 && i.statusCode < 300));
  if (failed.length) throw new Error(`${page.path}: measured without its data; ${failed.map((i) => `${i.url} answered ${i.statusCode}`).join(", ")}`);
}

const median = (rows) => [...rows].sort((x, y) => x.perf - y.perf)[Math.floor(rows.length / 2)];

export async function measureAll({ base = null, runs = RUNS, log = () => {} } = {}) {
  const dist = join(ROOT, "dist");
  if (!base && !existsSync(join(dist, "index.html"))) throw new Error("no dist/index.html; build first");
  const scratch = mkdtempSync(join(tmpdir(), "web-measure-"));
  const local = base ? null : await serve(dist);
  const origin = base ?? local.base;
  let n = 0;
  const pages = {};
  let env = null;
  try {
    for (const page of PAGES) for (const device of DEVICES) {
      const rows = [];
      for (let i = 0; i < runs; i++) {
        const before = local?.docs.length ?? 0;
        const lhr = await lighthouse(origin + page.path, device, scratch, n++);
        checkLoad(lhr, page, local?.docs.slice(before).find((d) => d.path === page.path)?.file);
        env ??= { chrome: lhr.environment.hostUserAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? "?", benchmark: [] };
        env.benchmark.push(Math.round(lhr.environment.benchmarkIndex));
        rows.push(summary(lhr));
        log(`${page.name}/${device} run ${i + 1}: perf ${rows.at(-1).perf}, LCP ${rows.at(-1).lcp_ms} ms`);
      }
      pages[`${page.name}/${device}`] = { ...median(rows), perf_runs: rows.map((r) => r.perf) };
    }
    const control = base ? null : await controlRun(dist, pages["home/phone"], scratch, n++, log);
    return {
      where: base ? `${base} live` : "local dist/ via scripts/measure.mjs (vercel.json routing + headers, brotli, HTTP/1.1)",
      lighthouse: LIGHTHOUSE, chrome: env.chrome, cpu_benchmark: median(env.benchmark.map((b) => ({ perf: b }))).perf,
      runs, throttling: "Lighthouse default (simulated)", pages, ...(control ? { control } : {}),
    };
  } finally {
    await local?.close();
    rmSync(scratch, { recursive: true, force: true });
  }
}

async function controlRun(dist, real, scratch, n, log) {
  const delayMs = process.env.WEB_GATE_INVERT_CONTROL === "1" ? 0 : CONTROL_DELAY_MS;
  const slow = await serve(dist, { delayMs });
  try {
    const lhr = await lighthouse(`${slow.base}/`, "phone", scratch, n);
    checkLoad(lhr, PAGES[0], slow.docs.find((d) => d.path === "/")?.file);
    const s = summary(lhr);
    const control = { page: "home/phone", delay_ms: CONTROL_DELAY_MS, fcp_ms: real.fcp_ms, fcp_ms_slowed: s.fcp_ms, lcp_ms: real.lcp_ms, lcp_ms_slowed: s.lcp_ms };
    log(`control: FCP ${real.fcp_ms} -> ${s.fcp_ms} ms with every response held ${delayMs} ms`);
    // Half the delay, not all of it: the simulator turns 1000 ms per response into about 1100 ms
    // of first paint (measured 2026-10-21), too close to the line for run-to-run noise, while with
    // no delay the two loads landed 214 ms apart, the slowed copy first.
    if (s.fcp_ms - real.fcp_ms < CONTROL_DELAY_MS / 2) {
      const e = new Error(`the control did not register: holding every response ${delayMs} ms moved first paint ${s.fcp_ms - real.fcp_ms} ms (${JSON.stringify(control)})`);
      e.step = "control";
      throw e;
    }
    return control;
  } finally {
    await slow.close();
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const result = await measureAll({ base: opt("--base") ?? null, runs: Number(opt("--runs") ?? RUNS), log: (l) => console.error(l) });
  console.log(JSON.stringify(result, null, 1));
}
