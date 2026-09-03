/**
 * Proves every category name and item reaches the built HTML as TEXT.
 *
 * This is the gate for the defect the card fan fixed: the homepage's What We Buy
 * section was one flat .webp of a Facebook flyer, so every category name was
 * pixels and a crawler, an assistant or a screen reader got nothing from the one
 * section whose whole job is naming what the business buys. Nothing stopped that
 * from silently returning — an image is one commit away.
 *
 * NOTHING HERE IS A COUNT. The expected set is the list itself, so adding a
 * category or an item extends this check by existing. A gate holding its own
 * copy of "ten names" is the one-thing-two-representations defect wearing a
 * test's clothes: after the eleventh it either fails honestly, which is noise, or
 * keeps passing while checking a list nobody updated — a test that lies by being
 * satisfied.
 *
 * MAY fail the build, unlike the crawl. Everything checked is a disagreement
 * between files in the repo. The one environment-dependent case — a crawl that
 * degraded and left a shell instead of a snapshot — is detected exactly rather
 * than guessed at, and skipped, because un-prerendered pages still work.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, ADDITIONAL_ITEMS } from "../src/content/categories.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const fail = (message) => {
  process.stderr.write(`CATEGORY TEXT CHECK FAILED: ${message}\n`);
  process.exitCode = 1;
};

/**
 * Compare against rendered TEXT, not raw markup. A name reaching the page only
 * inside an alt attribute is exactly the defect this exists to catch — an alt is
 * a description of a picture, not the content — so tags go first and their
 * attributes with them.
 */
const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

/*
 * THE SHELL IS app.html, NOT index.html, and reading the wrong one turns this
 * check into a rubber stamp for the exact page it exists to protect.
 *
 * The crawl now writes the home snapshot over dist/index.html, because Vercel
 * consults the filesystem before rewrites and so answers `/` with that file. The
 * moment it did, dist/home/index.html and dist/index.html became byte-identical
 * — and the equality test below read that as "not snapshotted, nothing to
 * check" and passed. A build that had prerendered the home page perfectly
 * reported it as skipped:
 *
 *   CATEGORY TEXT: / was not snapshotted (shell copy) — skipped, nothing to check.
 *
 * app.html is the pristine shell the crawl sets aside before it overwrites
 * anything, so comparing against it is the same test that was intended, against
 * a file that cannot become one of the snapshots it is measuring.
 */
const shellPath = path.join(DIST, "app.html");
const shell = fs.existsSync(shellPath) ? fs.readFileSync(shellPath) : null;

/** The homepage fan renders the categories; /categories renders those plus the extras. */
const TARGETS = [
  { file: "home/index.html", route: "/", expected: [...CATEGORIES.map((c) => c.title), ...CATEGORIES.flatMap((c) => c.items)] },
  { file: "categories/index.html", route: "/categories", expected: [...CATEGORIES.map((c) => c.title), ...CATEGORIES.flatMap((c) => c.items), ...ADDITIONAL_ITEMS] },
];

for (const target of TARGETS) {
  const file = path.join(DIST, target.file);
  if (!fs.existsSync(file)) {
    fail(`dist/${target.file} does not exist, so ${target.route} ships no prerendered text at all`);
    continue;
  }

  // A route the crawl skipped was written as a byte copy of the clean shell, so
  // it carries no rendered text by design. Detected by comparing bytes rather
  // than by sniffing for content, which would also swallow a real regression.
  if (shell && fs.readFileSync(file).equals(shell)) {
    process.stdout.write(`CATEGORY TEXT: ${target.route} was not snapshotted (shell copy) — skipped, nothing to check.\n`);
    continue;
  }

  const text = textOf(fs.readFileSync(file, "utf8"));
  const missing = target.expected.filter((name) => !text.includes(name));
  if (missing.length) {
    fail(
      `${missing.length} of ${target.expected.length} category names are not text in dist/${target.file}: ` +
        `${missing.join(", ")}. They are in src/content/categories.js, so ${target.route} is rendering ` +
        "them as an image, or not at all."
    );
  } else {
    process.stdout.write(`CATEGORY TEXT: all ${target.expected.length} names and items are text in dist/${target.file}\n`);
  }
}
