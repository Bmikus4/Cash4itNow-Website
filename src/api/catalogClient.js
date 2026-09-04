/**
 * GET /api/public/catalog?slug=… -> { ok, catalog: {…}, items: PublicItem[] }
 *
 * The second half of the sale-page seam. `salesClient` says which sales exist and carries each
 * one's catalogue reference; this asks what is in one. Fetched only for a sale whose reference says
 * there is something to fetch, so a site with no published catalogues makes no extra requests at
 * all.
 *
 * The state machine lives in `catalogFeed.js` where the build gate can reach it. This file is the
 * transport and the mock.
 */

import { resolveOrigins } from "@/lib/origins";
import { readCatalogFeed, FEED_DEGRADED } from "@/api/catalogFeed";
import { healthyFeed, degradedFeed } from "@/api/catalogFeed.fixtures";

// The origin comes from src/lib/origins.js and nowhere else: a second copy of it is what let the
// CSP and the actual request target drift apart. `predeploy.mjs` fails the build on a literal.
const ENDPOINT = import.meta.env.VITE_CATALOG_ENDPOINT || resolveOrigins(import.meta.env).catalogEndpoint;

/**
 * Shares `VITE_SALES_MOCK` with the sales feed rather than taking a switch of its own.
 *
 * The two are one seam from a visitor's point of view — a sale and its photographs — and a
 * development run where the sale list is mocked and the catalogue is live is a state nobody wants
 * and everybody would eventually get. `degraded` serves the platform's real degraded response here
 * too, because **a mock that never degrades cannot show you the degraded path**, which is the
 * lesson this seam already paid for once.
 */
const MOCK_MODE = import.meta.env.VITE_SALES_MOCK;

export const catalogQueryKey = (slug) => ["public-catalog", slug];

/**
 * Returns a `catalogFeed` result. IT DOES NOT THROW, for the reason `fetchSales` gives at length:
 * an outcome in react-query's `isError` is an outcome the consumer has to remember to read, and the
 * degraded path is exactly the one that gets forgotten. Returning the state as DATA makes it
 * impossible to consume this feed without meeting it.
 */
export async function fetchCatalog(slug) {
  if (!slug) return { state: FEED_DEGRADED, items: [], count: null, reason: "no_slug" };
  if (MOCK_MODE === "degraded") return readCatalogFeed(degradedFeed.status, degradedFeed.body);
  if (MOCK_MODE === "1") return readCatalogFeed(healthyFeed.status, healthyFeed.body);

  const url = `${ENDPOINT}?slug=${encodeURIComponent(slug)}`;
  let response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (cause) {
    // Logged because the server logs its half; a degradation nobody can see is the state this seam
    // spent two ledger rows removing.
    console.error("[catalog] endpoint unreachable", cause);
    return readCatalogFeed(0, null);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Left null on purpose: a body we could not parse is not an empty body, and the reader tells
    // those apart.
    body = null;
  }

  const result = readCatalogFeed(response.status, body);
  if (result.state === FEED_DEGRADED) {
    console.error(`[catalog] feed degraded: ${result.reason} (HTTP ${response.status})`);
  }
  return result;
}

/**
 * `enabled` is the caller's, and it must stay that way.
 *
 * The only sale worth asking about is one whose reference says a catalogue exists — `CATALOG_ABSENT`
 * and `CATALOG_EMPTY` are already final answers, and asking anyway would put a request on every
 * sale page on the site to be told what the page already knew.
 *
 * `retry: false` and `refetchInterval: false` for the reason the sales query gives: the server sends
 * `no-store` on its degraded paths precisely so a cached failure cannot outlive its own cause, and
 * retrying or polling from here rebuilds that hazard one layer up. `staleTime` is five minutes and
 * NOT zero, which is the one place these two queries differ: the sales feed's degraded answer must
 * never be reused, while this one is a published catalogue behind a CDN with `s-maxage=300` — asking
 * again inside that window can only return the same bytes.
 */
export function catalogQuery(slug, enabled) {
  return {
    queryKey: catalogQueryKey(slug),
    queryFn: () => fetchCatalog(slug),
    enabled: Boolean(enabled && slug),
    retry: false,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  };
}
