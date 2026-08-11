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

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [react(), cspMatchesOrigins()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
