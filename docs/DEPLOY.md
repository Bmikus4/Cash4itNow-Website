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

It is `vite build` rather than `npm run build`, and the difference is the
prerender plus the five checks chained behind it:

```
vite build && node scripts/prerender.mjs
           && check-sitemap && check-category-text
           && check-catalog-states && check-degraded-states && check-event-schema
```

### Why the full build cannot run in CI

`scripts/prerender.mjs` drives a real Chrome over CDP:

```js
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
```

Vercel builds on Linux, no browser ships in the build image, and there is no
puppeteer in `devDependencies` to supply one. The missing-browser `throw` is
caught, so the crawl does not fail loudly; it marks all 16 routes skipped and
writes shells instead. `check-category-text.mjs` then refuses to certify a shell
as a snapshot, because it requires all 100 category names to be present as text
in `dist/home/index.html`. Both behave correctly. The pipeline is simply not
runnable anywhere except a Windows workstation, and never has been.

This was **not** what failed the two deploys above; the invalid JSON key was.
It is a separate, real problem that has not yet been tested in CI.

### What that costs, measured

Production serves the SPA shell for every route. On 2026-09-03, after the merge:

```
/home/index.html        200   2062 bytes    should be 76365
/blog/index.html        200   2062 bytes
/categories/index.html  200   2062 bytes
/404.html               200   2062 bytes
```

Those are literal file paths and they answered with the root shell, because the
prerendered files are not in the deployment. Every rewrite in `vercel.json`
points at a file that does not exist, and the site works for people only because
Vercel falls through to `index.html` and React takes over.

The sharp consequence: the category-text fix of 2026-08-11 moved all 100 names
out of a `.webp` and into markup, and **no crawler has ever seen them**, because
production has never served the snapshot that contains them. The defect that fix
closed is still live in production for anything that does not execute JS.

### To finish it

Either give the crawl a browser on Linux, by adding `puppeteer` to
`devDependencies` and setting `CHROME_PATH` from `puppeteer.executablePath()`,
then moving `buildCommand` to `npm run build`; or keep the crawl off CI and
deploy prebuilt output from a machine that has Chrome (`vercel build` then
`vercel deploy --prebuilt`), which trades away push-to-deploy.

Neither is started. Whoever does it should confirm the result the way this
document did: fetch `/home/index.html` in production and read the byte count. A
green build proves nothing here, because a green build has always been available.

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
