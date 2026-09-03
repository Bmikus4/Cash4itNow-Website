# How this site deploys, and what production is not doing

Written 2026-09-03, after main was fast-forwarded 38 commits onto production for
the first time since the static strip. Everything here was measured against the
live site, not inferred from the repo.

## vercel.json takes no comments, and unknown keys fail the deploy

Vercel's schema (`https://openapi.vercel.sh/vercel.json`) sets
`additionalProperties: false` over 42 permitted top-level keys. The usual JSON
comment dodge, a sibling key named `"//something"`, is therefore **rejected at
upload**, and the deployment errors before any build runs.

This cost two production deploys. Both showed `● Error` with no build log,
because the file never got as far as building. `npx vercel build` does **not**
catch it: that validates locally and passed cleanly on the same file. The only
signals are `vercel ls` showing `Error` with a `?` duration, and the deployment
having no logs at all.

So: **no comments in `vercel.json`, ever.** Anything that needs explaining is
explained here.

## buildCommand is pinned, and it is deliberately not the full build

`"buildCommand": "vite build"`.

It is pinned because Vercel otherwise uses the project's dashboard setting, and
nothing in the repo said what that was. The dashboard was configured when this
repo was a plain Base44 export, and pinning it here makes the repo the single
source of truth for how the site is built, the same rule `src/lib/origins.js`
enforces for hosts.

It WAS `vite build` rather than `npm run build` until 2026-09-03, and the
difference is the prerender plus the five checks chained behind it:

```
vite build && node scripts/prerender.mjs
           && check-sitemap && check-category-text
           && check-catalog-states && check-degraded-states && check-event-schema
```

### Why the full build could not run in CI, and what changed

`scripts/prerender.mjs` drives a real Chrome over CDP, and the path to it was
one literal:

```js
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
```

Vercel builds on Linux, no browser ships in the build image, and there was no
puppeteer in `devDependencies` to supply one. The missing-browser `throw` is
caught, so the crawl did not fail loudly; it marked all 16 routes skipped and
wrote shells instead. The pipeline was not runnable anywhere except a Windows
workstation, and never had been.

**Attempted 2026-09-03.** `puppeteer` is a devDependency solely to supply a
browser, `browserExecutable()` resolves `CHROME_PATH` first and
`puppeteer.executablePath()` second, and `buildCommand` is now `npm run build`.

**The first CI attempt still produced 0 of 16 snapshots**, and the reason is
worth writing down because nothing about it is guessable from the repo:

- **Vercel's npm does not run postinstall scripts.** The install log says so and
  carries on:
  ```
  npm warn allow-scripts 3 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   puppeteer@25.10.0 (postinstall: node install.mjs)
  ```
  So the build got the puppeteer library and no browser at all. The crawl now
  fetches Chrome itself through `@puppeteer/browsers` when the binary is absent,
  rather than relying on a postinstall hook that a build machine may refuse.
- **`.puppeteerrc.cjs` moves that download into `node_modules/.cache`.** The
  default is `~/.cache/puppeteer`, which Vercel does not restore, so it would be
  re-fetched on every deploy. `browserExecutable()` reads the directory out of
  that file rather than repeating the path, so the two cannot drift.
- **On Linux the browser is `@sparticuz/chromium`, not Chrome for Testing.**
  Puppeteer's Chromium downloads and installs perfectly on a Vercel builder and
  then will not start:
  ```
  .../chrome-linux64/chrome: error while loading shared libraries:
  libnspr4.so: cannot open shared object file: No such file or directory
  ```
  The image carries no NSS/NSPR and a Vercel build cannot install system
  packages that persist. `@sparticuz/chromium` is a Chromium built for Amazon
  Linux with those libraries beside it. Its own `args` are used too, minus
  `--single-process`: that flag is right for Lambda and makes the browser refuse
  to open a second target, which is what `/json/new` asks for on every route.
- **`--no-sandbox` and `--disable-dev-shm-usage`.** The build container runs as
  root, where Chrome's sandbox refuses to start; and its `/dev/shm` is 64MB,
  which the renderer exhausts mid-crawl.
- **Chrome's stderr is captured, not discarded.** The first attempt reported only
  "browser never answered on the debugging port", which is equally true of a
  missing binary, a missing shared library, a sandbox refusal and an exhausted
  `/dev/shm`. Chrome names which one on stderr in a single line. Throwing that
  away is what made the first failure cost a deploy to understand.

### A skipped route does NOT fail the build

Worth being exact, because the opposite was written here at first.
`check-category-text.mjs` prints

```
CATEGORY TEXT: / was not snapshotted (shell copy) — skipped, nothing to check.
```

and exits 0. It refuses to *certify* a shell, which is not the same as
rejecting one. A build whose crawl fails is therefore green and ships shells —
the same output `vite build` gave before any of this, so the change cannot make
deploys worse, and equally cannot be assumed to have worked. **Read the build
log for `PRERENDER: N snapshotted`, or fetch a route in production and read the
byte count.** 2062 bytes is the shell.

### What it cost while it was broken, measured

Production served the SPA shell for every route. On 2026-09-03, after the merge:

```
/home/index.html        200   2062 bytes    should be 102279
/blog/index.html        200   2062 bytes
/categories/index.html  200   2062 bytes
/404.html               200   2062 bytes
```

Those are literal file paths and they answered with the root shell, because the
prerendered files were not in the deployment. Every rewrite in `vercel.json`
pointed at a file that did not exist, and the site worked for people only
because Vercel fell through to `index.html` and React took over.

The sharp consequence: the category-text fix of 2026-08-11 moved all 100 names
out of a `.webp` and into markup, and **no crawler had ever seen them**, because
production had never served the snapshot that contains them.

Confirm the result the way this document did: fetch `/home/index.html` in
production and read the byte count. A green build proves nothing here, because a
green build has always been available.

## ignoreCommand

```
git diff --quiet HEAD^ HEAD -- src public index.html vercel.json vite.config.js \
  tailwind.config.js postcss.config.js jsconfig.json package.json package-lock.json
```

Exit 0 skips the build. A commit touching only `docs/` deploys nothing, which is
intended. A commit touching `vercel.json` does deploy.

## Verifying a deploy actually landed

The bundle hash is not a reliable signal. `vite build` is deterministic, so a
change to `vercel.json` or `docs/` produces the identical `assets/index-*.js`
name and an unchanged hash means nothing either way.

Use `npx vercel ls` and read Status and Duration. `● Error` with a `?` duration
is a rejected deployment; `● Error` with a real duration is a failed build.
