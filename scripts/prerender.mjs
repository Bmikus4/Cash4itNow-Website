/**
 * Post-build snapshot crawl (F8, option 1). Serves the freshly built dist/,
 * renders each route in headless Chrome, and writes the rendered HTML back into
 * dist/<route>/index.html so a client that does not execute JS receives real
 * per-route markup, tags and JSON-LD.
 *
 * THE NON-NEGOTIABLE: this must never fail the build. A missing browser, an
 * unreachable feed, a route that throws — each degrades to "not snapshotted,
 * stays client-rendered", says so loudly, and exits 0. A pipeline that breaks
 * when the database hiccups is worse than un-prerendered pages.
 *
 * Everything decidable lives in ./prerender/lib.mjs as pure functions. This file
 * is the part that cannot be tested without a browser, and it is kept thin for
 * that reason.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  routesFromApp,
  postExpansions,
  outputPathFor,
  countHiddenSections,
  stripNondeterminism,
  skipLine,
} from "./prerender/lib.mjs";
import { POSTS } from "../src/content/posts.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = 5175;
const CDP_PORT = 9444;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORT = { width: 1280, height: 900 };
const SCROLL_FRAMES = 14;

const skipped = [];
const written = [];
const log = (line) => process.stdout.write(`${line}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function serveDist() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".txt": "text/plain" };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const asFile = path.join(DIST, url);
    const isFile = url !== "/" && fs.existsSync(asFile) && fs.statSync(asFile).isFile();
    const file = isFile ? asFile : path.join(DIST, "index.html");
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function connect() {
  const version = await fetch(`http://localhost:${CDP_PORT}/json/version`).then((r) => r.json());
  const target = await fetch(`http://localhost:${CDP_PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, browser: version.Browser };
}

/**
 * Scroll before capturing. Sections below the fold are framer-motion whileInView
 * and start at opacity:0 — a snapshot of an unscrolled page is markup that says
 * invisible, which is worse than no snapshot because it looks like a success.
 */
async function snapshot(send, route) {
  await send("Page.navigate", { url: `http://localhost:${PORT}${route}` });
  await sleep(2600);
  for (let i = 0; i < SCROLL_FRAMES; i++) {
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${i} * ${VIEWPORT.height - 60})` });
    await sleep(320);
    const atEnd = await send("Runtime.evaluate", {
      expression: "window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4",
      returnByValue: true,
    });
    if (atEnd?.result?.value) break;
  }
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
  await sleep(240);
  const html = await send("Runtime.evaluate", {
    expression: "'<!doctype html>\\n' + document.documentElement.outerHTML",
    returnByValue: true,
  });
  return html?.result?.value || "";
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    log("PRERENDER: no dist/index.html — nothing to snapshot. Build output unchanged.");
    return;
  }

  const { static: staticRoutes, dynamic } = routesFromApp(
    fs.readFileSync(path.join(ROOT, "src/App.jsx"), "utf8"),
    postExpansions(POSTS)
  );
  log(`PRERENDER: ${staticRoutes.length} static routes from src/App.jsx: ${staticRoutes.join(" ")}`);
  for (const route of dynamic) {
    skipped.push(route);
    log(skipLine(route, "dynamic, and its slug list comes from the sales feed, which needs a database"));
  }

  let chrome;
  let session;
  const server = await serveDist();
  try {
    if (!fs.existsSync(CHROME)) throw new Error(`no browser at ${CHROME} (override with CHROME_PATH)`);
    chrome = spawn(CHROME, [
      "--headless=new", "--disable-gpu", `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${path.join(ROOT, "node_modules/.cache/prerender-profile")}`, "about:blank",
    ], { stdio: "ignore" });
    for (let attempt = 0; attempt < 20 && !session; attempt++) {
      await sleep(500);
      try { session = await connect(); } catch { /* still starting */ }
    }
    if (!session) throw new Error("browser never answered on the debugging port");
    log(`PRERENDER: ${session.browser}`);
    await session.send("Page.enable");
    await session.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });

    for (const route of staticRoutes) {
      try {
        const raw = await snapshot(session.send, route);
        if (!raw.includes("<div id=\"root\">") || raw.length < 2000) throw new Error(`suspiciously small render (${raw.length} bytes)`);
        const html = stripNondeterminism(raw);
        const hidden = countHiddenSections(html);
        const out = path.join(DIST, outputPathFor(route));
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
        written.push(route);
        log(`  ok      ${route.padEnd(12)} ${String(html.length).padStart(7)} bytes -> dist/${outputPathFor(route)}${hidden ? `  WARNING: ${hidden} element(s) still opacity:0` : ""}`);
      } catch (error) {
        skipped.push(route);
        log(skipLine(route, error.message));
      }
    }
  } catch (error) {
    for (const route of staticRoutes.filter((r) => !written.includes(r) && !skipped.includes(r))) {
      skipped.push(route);
      log(skipLine(route, error.message));
    }
  } finally {
    session?.ws.close();
    chrome?.kill();
    server.close();
  }

  // A skipped STATIC route still needs the file its rewrite names, or degrading
  // stops being degradation: vercel.json points /about at /about/index.html
  // unconditionally, so a run with no browser would ship rewrites aimed at files
  // that do not exist and 404 the whole site while the build stayed green. The
  // shell is exactly the right fallback — it is what an un-snapshotted route was
  // always meant to serve — and copying it is the same move vite.config makes for
  // 404.html. Deterministic: a byte copy of a file this build just produced.
  const shell = fs.readFileSync(path.join(DIST, "index.html"));
  for (const route of staticRoutes.filter((r) => !written.includes(r))) {
    const out = path.join(DIST, outputPathFor(route));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, shell);
    log(`  shell   ${route} -> dist/${outputPathFor(route)} (client-rendered, but the rewrite's target now exists)`);
  }

  log(`PRERENDER: ${written.length} snapshotted, ${skipped.length} left client-rendered.`);
  if (skipped.length) log("PRERENDER: the skipped routes above are not broken — crawlers that do not run JS see the site default for them.");
}

// Never fail the build. An unhandled throw here would take a green build down
// over an optimisation, which is the one outcome this must not have.
main().catch((error) => {
  log(`PRERENDER: aborted — ${error.message}. Build output left as vite produced it.`);
  process.exitCode = 0;
});
