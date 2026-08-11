/**
 * THE ONE PLACE where an origin is written down.
 *
 * There used to be two copies of the API origin — `leadClient.ts` and
 * `salesClient.js` each carried their own literal — and that is how the CSP came
 * to allow `connect-src 'self'` while every request went somewhere else. The
 * platform API is a separate Vercel project from this site, so "self" has never
 * included it: on the first deploy the browser blocks every sales GET and every
 * lead POST. Nothing caught it because nothing has been deployed.
 *
 * So: one file, and the CSP's origin list is checked against it at build time by
 * `vite.config.js`. Adding a fetch to a new host means adding it here, and the
 * build fails until `vercel.json` agrees.
 *
 * Resolution takes an env bag rather than reading `import.meta.env` directly, so
 * the same function serves the browser bundle and the Node-side build check —
 * `import.meta.env` does not exist in Node and `process.env` does not exist in
 * the bundle.
 */

/** The platform: leads and the public sales feed. A separate Vercel project. */
export const DEFAULT_API_ORIGIN = "https://cash4itnow.vercel.app";

/** Where visitors are: the canonical public origin, used for absolute share URLs. */
export const DEFAULT_SITE_ORIGIN = "https://www.cash4itnow.com";

const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

export function resolveOrigins(env = {}) {
  const api = trimSlash(env.VITE_API_ORIGIN) || DEFAULT_API_ORIGIN;
  const site = trimSlash(env.VITE_SITE_ORIGIN) || DEFAULT_SITE_ORIGIN;
  return {
    api,
    site,
    leadEndpoint: `${api}/api/public/lead`,
    salesEndpoint: `${api}/api/public/sales`,
    /** Every host the browser is allowed to fetch from; `'self'` is added by the CSP. */
    connectOrigins: [api],
  };
}
