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

/**
 * The platform: leads, the public sales feed and published catalogs. A separate
 * Vercel project.
 *
 * NOT `cash4itnow.vercel.app`. That was the first-generation catalog builder and
 * its deployment is GONE — every path on it answers Vercel's own 404, "The
 * deployment could not be found", so the site was pointed at a host that cannot
 * fail loudly enough to be noticed: the sales GET returns a 404 body, the reader
 * classifies it as degraded, and the home page shows "we could not load the
 * sales list" forever. Confirmed 2026-09-03 against both hosts.
 *
 * The live project is `cash4itnow-platform`, and it has been ready the whole
 * time: /api/public/sales answers 200 {"upcoming":[],"past":[]}, /api/public/lead
 * is POST-only, /api/public/catalog refuses an unpublished slug by name, and its
 * PUBLIC_FORM_ORIGINS already allowlists www.cash4itnow.com and the apex.
 */
export const DEFAULT_API_ORIGIN = "https://cash4itnow-platform.vercel.app";

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
