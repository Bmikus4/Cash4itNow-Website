# www.cash4itnow.com

**Work leaves this repo only through `node scripts/session.mjs -m "<what is now true>" [-F body.txt] -- <paths>`.**
It lints, holds the typecheck error count to the last ticket's, runs the full build, measures Home
and /shop on phone and desktop with Lighthouse (`scripts/measure.mjs`), appends a ticket to
`feed/feed.jsonl`, commits the named paths by pathspec and pushes the current branch. The
`.githooks/pre-push` hook refuses any tip without a ticket; turn the hooks on in a fresh clone with
`git config core.hooksPath .githooks`.

- Gate work on `lead-capture` (Vercel preview). `main` is production and deploys on push: promote
  with `git push origin lead-capture:main` only on Ben's go.
- The gate takes about 15 minutes: a 3.5 minute build on this exFAT drive, then 13 Lighthouse loads.
  Measure in between with `node scripts/measure.mjs [--runs 1] [--base https://www.cash4itnow.com]`.
- Local numbers are not live numbers (no HTTP/2 locally). Compare ticket with ticket.
- Build gates and deploy traps: `docs/DEPLOY.md`. Design invariants: `docs/UI-PRINCIPLES.md`.
- A photograph added to or replaced in `public/img` needs `python scripts/img-variants.py` and its
  output committed, or the build fails. `src/main.jsx` holds the app back until the prerendered paint
  is recorded; read it before touching how the app boots.
