/**
 * Proves the built sitemap is right, rather than reading it and forming an
 * impression. Runs after the prerender crawl, over dist/.
 *
 * Three things, and they are the three ways a sitemap goes wrong:
 *
 *   1. It lists a URL the site does not have, or omits one it does. Re-derived
 *      from src/App.jsx and src/content/posts.js — the same source the gate and
 *      the crawl use — so this catches a route added to the app while the
 *      generator was bypassed.
 *   2. It lists a noindex URL. Asking a crawler to fetch a page that then tells
 *      it to go away spends crawl budget to achieve nothing.
 *   3. A listed URL resolves to a file that does not exist in dist/. This is the
 *      one that would actually cost leads: vercel.json names each route's
 *      snapshot file, so a route whose file is missing is a hard 404 on a URL we
 *      submitted to Google ourselves.
 *
 * UNLIKE the crawl, this MAY fail the build. The crawl must stay green when the
 * environment degrades — no browser, no feed — because un-prerendered pages
 * still work. Everything checked here is a disagreement between files in the
 * repo, which no environment can cause and no deploy should carry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { noindexRoutes, postExpansions, routesFromApp } from "./prerender/lib.mjs";
import { POSTS } from "../src/content/posts.js";
import { resolveOrigins } from "../src/lib/origins.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");

const fail = (message) => {
  process.stderr.write(`SITEMAP CHECK FAILED: ${message}\n`);
  process.exitCode = 1;
};

const readSource = (specifier) => {
  for (const ext of ["", ".jsx", ".js"]) {
    const file = path.resolve(SRC, `${specifier.replace(/^\.\//, "")}${ext}`);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return fs.readFileSync(file, "utf8");
  }
  return null;
};

const sitemapPath = path.join(DIST, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  fail("dist/sitemap.xml does not exist. The build should have generated it.");
  process.exit(1);
}

const app = fs.readFileSync(path.join(SRC, "App.jsx"), "utf8");
const { static: staticRoutes } = routesFromApp(app, postExpansions(POSTS));
const excluded = new Set(noindexRoutes(app, readSource));
const expected = new Set(staticRoutes.filter((route) => !excluded.has(route)));

const { site } = resolveOrigins(process.env);
const xml = fs.readFileSync(sitemapPath, "utf8");
const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const offOrigin = listed.filter((url) => !url.startsWith(`${site}/`));
if (offOrigin.length) fail(`sitemap lists URLs that are not on ${site}: ${offOrigin.join(", ")}`);

const actual = new Set(listed.map((url) => url.slice(site.length)));

const missing = [...expected].filter((route) => !actual.has(route));
const extra = [...actual].filter((route) => !expected.has(route));
if (missing.length) fail(`sitemap is missing ${missing.join(", ")}`);
if (extra.length) fail(`sitemap lists ${extra.join(", ")}, which the app does not serve or has marked noindex`);

// Where each URL actually lands. vercel.json is the routing table in production,
// so it is what decides which file a crawler receives.
const rewrites = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).rewrites ?? [];
for (const route of [...actual].sort()) {
  const rule = rewrites.find((r) => r.source === route);
  if (!rule) {
    fail(`sitemap lists ${route} but vercel.json has no rewrite for it — it would fall to the 404`);
    continue;
  }
  const file = path.join(DIST, rule.destination);
  if (!fs.existsSync(file)) {
    fail(`sitemap lists ${route}, vercel.json sends it to ${rule.destination}, and that file is not in dist/`);
  }
}

if (!process.exitCode) {
  process.stdout.write(`SITEMAP: ${actual.size} URLs, every one routed to a file that exists in dist/.\n`);
  if (excluded.size) process.stdout.write(`SITEMAP: excluded as noindex: ${[...excluded].join(", ")}\n`);
}
