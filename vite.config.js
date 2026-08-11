import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'path'
import { defineConfig } from 'vite'
import { resolveOrigins } from './src/lib/origins.js'
import { POSTS } from './src/content/posts.js'
import { noindexRoutes, postExpansions, routesFromApp, sitemapXml } from './scripts/prerender/lib.mjs'

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
 * Fails the build if any file under src/ writes a platform origin as a literal.
 *
 * The CSP check below validates the ORIGINS MODULE against vercel.json, so a
 * literal elsewhere is invisible to it: move VITE_API_ORIGIN and the checked
 * origin moves while the literal stays behind, pointing requests at a host the
 * CSP no longer allows — and the build passes. A green build proving nothing.
 * src/lib/origins.js is the only file allowed to spell an origin out.
 */
function noStrayOriginLiterals() {
  return {
    name: 'no-stray-origin-literals',
    apply: 'build',
    buildStart() {
      const { api, site } = resolveOrigins(process.env)
      const allowed = path.resolve(__dirname, 'src/lib/origins.js')
      const offenders = []
      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(full)
          else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && full !== allowed) {
            const text = fs.readFileSync(full, 'utf8')
            // Comments may name an origin; code may not. Strip line comments and
            // block comments before looking.
            const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
            for (const origin of [api, site]) {
              if (code.includes(origin)) offenders.push(`${path.relative(__dirname, full)} (${origin})`)
            }
          }
        }
      }
      walk(path.resolve(__dirname, 'src'))
      if (offenders.length) {
        this.error(
          `Origin literals outside src/lib/origins.js: ${offenders.join(', ')}. ` +
            'Import resolveOrigins instead — a literal here survives a change to ' +
            'VITE_API_ORIGIN and sends requests to a host the CSP does not allow.'
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
      // A route is covered by a rewrite to the shell (client-rendered) OR to its
      // own prerendered snapshot. Both are valid; the terminal /(.*) rule points
      // at /404.html and must never read as coverage, or the gate would pass for
      // every missing route the moment a catch-all existed.
      const covering = new Set(
        (config.rewrites ?? [])
          .filter((rule) => rule.destination === '/index.html' || /^\/[\w./-]+\/index\.html$/.test(rule.destination))
          .map((rule) => rule.source)
      )

      // Derived by the SAME function the prerender crawl uses, so the gate and
      // the crawl cannot disagree about what a route is. It drops the in-app
      // "*", expands /blog/:slug into one route per post, and leaves /sale/:slug
      // parameterised — React Router and Vercel spell params alike.
      const { static: staticRoutes, dynamic } = routesFromApp(app, postExpansions(POSTS))
      const routes = [...staticRoutes, ...dynamic]
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

/** Named once: the generator writes it and the robots.txt gate checks for it. */
const SITEMAP_FILE = 'sitemap.xml'

/**
 * Fails the build if public/robots.txt's `Sitemap:` line is not the canonical
 * origin's sitemap.
 *
 * Same coupling as the og:image gate and the same reason. robots.txt cannot
 * import a module, so its absolute URL is a SECOND copy of the origin — move
 * VITE_API_ORIGIN or the canonical host and the copy stays behind, pointing every
 * crawler at a sitemap on a host we no longer serve. Two places holding one
 * origin is precisely the shape that produced F7, where the CSP and the clients
 * disagreed and the build stayed green.
 *
 * The failure is quiet in the worst way: robots.txt still parses, the site still
 * loads, and the only symptom is that nothing gets indexed from the sitemap.
 *
 * No Sitemap line is a valid choice and passes — the file documents that it must
 * be removed if the generator ever is. A WRONG one is what this refuses.
 */
function robotsSitemapMatchesOrigin() {
  return {
    name: 'robots-sitemap-matches-origin',
    apply: 'build',
    buildStart() {
      const robotsPath = path.resolve(__dirname, 'public/robots.txt')
      if (!fs.existsSync(robotsPath)) return

      const line = fs.readFileSync(robotsPath, 'utf8').match(/^\s*Sitemap:\s*(\S+)\s*$/im)?.[1]
      if (!line) return

      const { site } = resolveOrigins(process.env)
      const expected = `${site}/${SITEMAP_FILE}`
      if (line !== expected) {
        this.error(
          `public/robots.txt points crawlers at "${line}", but this build's sitemap is "${expected}". ` +
            'Every crawler would fetch a sitemap on the wrong host and index nothing from it. ' +
            'Update robots.txt, or correct src/lib/origins.js.'
        )
      }
    },
  }
}

/**
 * Writes dist/sitemap.xml from the same route source as everything else.
 *
 * §8.3 asks for a sitemap, and the blog is what makes it earn its place — five
 * new URLs that nothing else announces. It is GENERATED rather than written
 * because a hand-maintained sitemap is the one-thing-two-representations defect
 * with an .xml extension: it goes stale silently, and a stale sitemap is worse
 * than none, since it asks crawlers to fetch URLs that no longer exist while
 * omitting the ones that do.
 *
 * Noindex routes are excluded, read from the page components themselves — see
 * noindexRoutes(). Listing /favorites would ask a crawler to fetch a URL the
 * page then tells it to drop.
 *
 * `scripts/check-sitemap.mjs` re-derives the expected set after the build and
 * fails if the file disagrees, so this is checked rather than eyeballed.
 */
function sitemapFromRoutes() {
  return {
    name: 'sitemap-from-routes',
    apply: 'build',
    closeBundle() {
      const src = path.resolve(__dirname, 'src')
      const readSource = (specifier) => {
        for (const ext of ['', '.jsx', '.js']) {
          const file = path.resolve(src, `${specifier.replace(/^\.\//, '')}${ext}`)
          if (fs.existsSync(file) && fs.statSync(file).isFile()) return fs.readFileSync(file, 'utf8')
        }
        return null
      }

      const app = fs.readFileSync(path.join(src, 'App.jsx'), 'utf8')
      const { static: staticRoutes } = routesFromApp(app, postExpansions(POSTS))
      const excluded = new Set(noindexRoutes(app, readSource))
      const listed = staticRoutes.filter((route) => !excluded.has(route))

      const dist = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(dist)) return
      fs.writeFileSync(path.join(dist, SITEMAP_FILE), sitemapXml(resolveOrigins(process.env).site, listed))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
    cspMatchesOrigins(),
    noStrayOriginLiterals(),
    shareImageIsReachable(),
    robotsSitemapMatchesOrigin(),
    spaRoutesAreRewritten(),
    sitemapFromRoutes(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
