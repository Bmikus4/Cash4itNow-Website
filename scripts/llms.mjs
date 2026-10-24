/**
 * Writes dist/llms.txt: the site in the shape AI assistants read first (llmstxt.org), the business
 * in one line, every answer page with its one-line description, then the pages that matter.
 *
 * Built from the same sources as the pages, so it cannot say something the site does not: POSTS from
 * the platform feed, and the description, phone and origin read from the files the pages use. Those
 * files are app code that plain Node cannot import (the `@` alias, import.meta.env), so the strings
 * are read out of them rather than copied here; a copy would go stale the day the copy changed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS, postPath } from "../src/content/posts.js";
import { resolveOrigins } from "../src/lib/origins.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const pick = (rel, re, what) => {
  const m = read(rel).match(re);
  if (!m) throw new Error(`llms.txt: could not read ${what} from ${rel}`);
  return m[1];
};

const site = resolveOrigins(process.env).site;
const description = pick("src/lib/usePageMeta.js", /export const SITE_DESCRIPTION =\s*"([^"]+)"/, "SITE_DESCRIPTION");
const phone = pick("src/api/leadForm.jsx", /export const CONTACT_PHONE = "([^"]+)"/, "CONTACT_PHONE");

const pages = [
  ["What we buy", "/categories"],
  ["Upcoming estate sales", "/upcoming-sales"],
  ["For realtors, attorneys and executors", "/for-professionals"],
  ["About", "/about"],
  ["Contact and free evaluation", "/contact"],
  ["Text alerts", "/text-alerts"],
];

const text = [
  "# Cash 4 It Now",
  "",
  `> ${description} Call ${phone}.`,
  "",
  "## Answers",
  "",
  ...POSTS.map((post) => `- [${post.title}](${site}${postPath(post)}): ${post.description}`),
  "",
  "## Pages",
  "",
  ...pages.map(([label, route]) => `- [${label}](${site}${route})`),
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "dist/llms.txt"), text);
console.log(`llms.txt: ${POSTS.length} answers, ${pages.length} pages`);
