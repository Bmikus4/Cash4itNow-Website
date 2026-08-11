import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'path'
import { defineConfig } from 'vite'
import { resolveOrigins } from './src/lib/origins.js'

/**
 * Fails the build if vercel.json's `connect-src` does not allow every origin the
 * app actually fetches from.
 *
 * This exists because the two disagreed and nothing noticed: the CSP said
 * `connect-src 'self'` while both clients pointed at the platform's separate
 * Vercel project, so the first deploy would have blocked every lead POST and
 * every sales GET. The failure is silent from the outside — `img-src` allows
 * `https:` generally, so the page loads its photographs and simply shows no
 * sales.
 *
 * vercel.json cannot import a module, so the literal lives there and this check
 * is the coupling. A new fetch host goes in src/lib/origins.js and the build
 * refuses to pass until vercel.json agrees.
 */
function cspMatchesOrigins() {
  return {
    name: 'csp-matches-origins',
    apply: 'build',
    buildStart() {
      const configPath = path.resolve(__dirname, 'vercel.json')
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      const csp = config.headers
        ?.flatMap((entry) => entry.headers ?? [])
        .find((header) => header.key === 'Content-Security-Policy')?.value
      if (!csp) this.error('vercel.json has no Content-Security-Policy header to check')

      const connectSrc = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('connect-src'))
      if (!connectSrc) this.error("vercel.json's CSP has no connect-src directive")

      const missing = resolveOrigins(process.env).connectOrigins.filter((origin) => !connectSrc.includes(origin))
      if (missing.length) {
        this.error(
          `vercel.json connect-src is missing ${missing.join(', ')}. ` +
            'Every fetch would be blocked at runtime. Add it to the CSP in vercel.json, ' +
            'or correct src/lib/origins.js.'
        )
      }
    },
  }
}

/**
 * Fails the build if index.html's static og:image is not an absolute URL on the
 * canonical origin, or if the file it names is not in public/.
 *
 * index.html cannot import a module, so its absolute URL is a second copy of the
 * origin — the same shape of duplication that caused the CSP defect. This is the
 * coupling. The missing-file half matters just as much: a scraper caches what it
 * fetched, so an og:image that 404s leaves a broken share preview standing for
 * weeks after the URL is corrected.
 */
function shareImageIsReachable() {
  return {
    name: 'share-image-is-reachable',
    apply: 'build',
    buildStart() {
      const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8')
      const url = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]
      if (!url) return // No static og:image is a valid choice; a wrong one is not.

      const { site } = resolveOrigins(process.env)
      if (!url.startsWith(`${site}/`)) {
        this.error(
          `index.html og:image is "${url}" but the canonical origin is "${site}". ` +
            'A share preview on the wrong origin is cached by scrapers. ' +
            'Update index.html, or correct src/lib/origins.js.'
        )
      }

      const file = path.resolve(__dirname, 'public', url.slice(site.length + 1))
      if (!fs.existsSync(file)) {
        this.error(`index.html og:image names ${url}, but ${file} does not exist. Every share would preview a 404.`)
      }
    },
  }
}

/**
 * The route list now lives in two places — `src/App.jsx` and `vercel.json`'s
 * rewrites — and a route added to one but not the other works perfectly in dev
 * and 404s in production, with nothing failing loudly in between. That is the
 * same silent second source of truth that produced the CSP defect. This gate is
 * the coupling.
 *
 * Only rewrites whose destination is `/index.html` count as covering a route.
 * The terminal `/(.*)` rule points at `/404.html` and must NOT be mistaken for
 * coverage, or the gate would pass for every missing route the moment a
 * catch-all exists — which is exactly the hole it is here to close.
 *
 * `closeBundle` writes `dist/404.html` as a byte copy of `dist/index.html`: it
 * is the destination of that terminal rule, so an unknown URL still gets the
 * real application and React still renders the branded PageNotFound. A copy
 * cannot drift from the app the way a second hand-built page would.
 */
function spaRoutesAreRewritten() {
  return {
    name: 'spa-routes-are-rewritten',
    apply: 'build',
    buildStart() {
      const app = fs.readFileSync(path.resolve(__dirname, 'src/App.jsx'), 'utf8')
      const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8'))
      const covering = new Set(
        (config.rewrites ?? []).filter((rule) => rule.destination === '/index.html').map((rule) => rule.source)
      )

      // "/" is served as a real file; "*" is the in-app 404, not a URL to rewrite.
      // React Router's /sale/:slug and Vercel's /sale/:slug spell params alike.
      const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((route) => route !== '/' && route !== '*')
      const missing = routes.filter((route) => !covering.has(route))
      if (missing.length) {
        this.error(
          `vercel.json has no rewrite to /index.html for ${missing.join(', ')}. ` +
            'Those routes exist in src/App.jsx and would fall to the 404 in production ' +
            'while working in dev. Add a rewrite for each.'
        )
      }
    },
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(dist, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [react(), cspMatchesOrigins(), shareImageIsReachable(), spaRoutesAreRewritten()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
