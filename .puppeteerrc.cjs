const path = require('node:path');

/**
 * Put Chromium inside node_modules/.cache so Vercel keeps it between builds.
 *
 * Puppeteer's default is ~/.cache/puppeteer, which is OUTSIDE anything Vercel
 * restores — so every deploy would re-download ~150MB of browser before the
 * prerender crawl could run. node_modules/.cache is on Vercel's cached paths,
 * which turns that into a one-off cost on the first build after a lockfile
 * change.
 *
 * This file must exist BEFORE `npm install` runs, or the download lands in the
 * default directory and executablePath() then points at a location that is
 * empty. If a build ever reports "no browser at .../node_modules/.cache/...",
 * that is the cause: run `npx puppeteer browsers install chrome`.
 */
module.exports = {
  cacheDirectory: path.join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
