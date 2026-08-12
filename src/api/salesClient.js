/**
 * GET /api/public/sales -> { upcoming: Sale[], past: Sale[] }
 *
 * Sale = { slug, title, description, imageUrl, city, state, startsAt, endsAt, catalog }
 *
 * The street address is deliberately absent until 48 hours before a sale, so
 * city and state carry every listing. Nothing here — and no layout consuming
 * it — may assume an address field will appear.
 *
 * One request serves all three surfaces (upcoming list, past list, sale page);
 * they share a react-query key so the page is fetched once.
 */

import { resolveOrigins } from "@/lib/origins";
import { readSalesResponse, FEED_DEGRADED } from "@/api/salesWire";
import { degradedConfiguration as DEGRADED_MOCK } from "@/api/salesWire.fixtures";

// The origin comes from src/lib/origins.js and nowhere else: a second copy of it
// is what let the CSP and the actual request target drift apart.
const ENDPOINT = import.meta.env.VITE_SALES_ENDPOINT || resolveOrigins(import.meta.env).salesEndpoint;

/**
 * `1` serves the healthy mock; `degraded` serves the platform's real degraded
 * response.
 *
 * A MOCK THAT NEVER DEGRADES CANNOT SHOW YOU THE DEGRADED PATH. This is F3d's
 * second hazard with a new face: the mock used to send an array for every sale,
 * which is why the catalog defect stayed invisible in development for weeks —
 * the one shape production always sends was the shape the mock never did. Do not
 * "tidy" this back to a single healthy fixture.
 */
const MOCK_MODE = import.meta.env.VITE_SALES_MOCK;

export const SALES_QUERY_KEY = ["public-sales"];

const MOCK = {
  upcoming: [
    {
      slug: "mount-lebanon-full-estate",
      title: "Mount Lebanon Full Estate",
      description:
        "Three floors and a full basement. Mid-century furniture, a wall of vinyl, tools, and a garage nobody has emptied since 1974.",
      imageUrl: "/hero-before.webp",
      city: "Mount Lebanon",
      state: "PA",
      startsAt: new Date(Date.now() + 6 * 86400000).toISOString(),
      endsAt: new Date(Date.now() + 8 * 86400000).toISOString(),
      catalog: [
        { title: "Living room", imageUrl: "/hero-after.webp" },
        { title: "Garage", imageUrl: "/hero-before.webp" },
      ],
    },
    {
      slug: "shaler-collector-downsize",
      title: "Shaler Collector Downsize",
      description:
        "Militaria, sports cards, signs and advertising. One owner, forty years of collecting, priced to move over two days.",
      imageUrl: "/hero-after.webp",
      city: "Shaler",
      state: "PA",
      startsAt: new Date(Date.now() + 20 * 86400000).toISOString(),
      endsAt: new Date(Date.now() + 21 * 86400000).toISOString(),
      // The REFERENCE shape the live feed actually publishes. The mock carried an
      // array for every sale, which is why F3d was invisible in development for
      // as long as it was: the one shape production always sends was the one
      // shape the mock never did.
      catalog: { slug: "shaler-collector-downsize", itemCount: 40 },
    },
  ],
  past: [
    {
      slug: "bethel-park-estate",
      title: "Bethel Park Estate",
      description: "Full-house liquidation completed in a weekend, home left broom-clean for the realtor.",
      imageUrl: "/hero-after.webp",
      city: "Bethel Park",
      state: "PA",
      startsAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      catalog: [],
    },
    {
      slug: "ross-township-record-collection",
      title: "Ross Township Record Collection",
      description: "Four thousand records, jazz and soul heavy, sold across two days to buyers from three states.",
      imageUrl: "/hero-before.webp",
      city: "Ross Township",
      state: "PA",
      startsAt: new Date(Date.now() - 75 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 74 * 86400000).toISOString(),
      // No `catalog` key at all: nothing has been published for this sale. The
      // page must render no photo section whatsoever, not an apology.
    },
  ],
};

/**
 * Returns a `salesWire` result — `FEED_OK` with both lists, or `FEED_DEGRADED`.
 * IT DOES NOT THROW, and that is a decision rather than an omission.
 *
 * Throwing put the outcome in react-query's `isError`, which no consumer read,
 * so a 503 and a quiet week were byte-identical on this side too (22452 measured
 * that: all three consumers destructure only `data` and `isLoading`). Returning
 * the state as DATA makes it impossible to consume the feed without meeting it.
 *
 * It also means react-query sees a success and DOES NOT RETRY — which is the
 * required behaviour, not a side effect. The server sends `no-store` on this
 * path because a cached 503 outlives its own cause; retrying or polling it from
 * here would rebuild the same hazard one layer up.
 */
export async function fetchSales() {
  if (MOCK_MODE === "degraded") return readSalesResponse(DEGRADED_MOCK.status, DEGRADED_MOCK.body);
  if (MOCK_MODE === "1") return readSalesResponse(200, MOCK);

  let response;
  try {
    response = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
  } catch (cause) {
    // Unreachable is a different fact from refused, and both are "cannot
    // answer". Logged because the server logs its half: a degradation nobody
    // can see is the state we just spent two rows removing.
    console.error("[sales] endpoint unreachable", cause);
    return readSalesResponse(0, { ok: false, degraded: "unreachable" });
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Left null on purpose: a body we could not parse is not an empty body, and
    // the wire tells those apart.
    body = null;
  }

  const result = readSalesResponse(response.status, body);
  if (result.state === FEED_DEGRADED) {
    console.error(`[sales] feed degraded: ${result.reason} (HTTP ${response.status})`);
  }
  return result;
}

/**
 * The options every consumer of this feed must use. Shared so the three surfaces
 * cannot drift, and because two of these three settings are the brief's
 * requirements rather than preferences.
 *
 * `retry: false` — never retry a degraded answer. `refetchInterval: false` —
 * never poll it. `staleTime: 0` — never reuse it without asking again, so a
 * degraded answer cannot outlive its own cause in this tab the way a cached 503
 * would have outlived it in a CDN. **If a future change adds caching to this
 * query, the degraded state must be excluded from it.**
 */
export function salesQuery() {
  return {
    queryKey: SALES_QUERY_KEY,
    queryFn: fetchSales,
    retry: false,
    refetchInterval: false,
    staleTime: 0,
  };
}

/**
 * A three-column grid holding two cards leaves a dead third column under a
 * centred heading. Both sale sections routinely run one or two, so the track
 * count follows the card count and the row stays centred.
 */
export function saleGridClass(count) {
  if (count === 1) return "grid-cols-1 max-w-md mx-auto";
  if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}

/** "Mount Lebanon, PA" — the whole location a listing gets before the sale week. */
export function saleLocation(sale) {
  return [sale?.city, sale?.state].filter(Boolean).join(", ");
}

/**
 * "March 14" for a one-day sale, "March 14-16" when it runs longer. endsAt is
 * optional, and a missing or unparseable startsAt returns an empty string
 * rather than "Invalid Date".
 */
export function saleDateRange(sale, format) {
  const start = sale?.startsAt ? new Date(sale.startsAt) : null;
  if (!start || Number.isNaN(start.getTime())) return "";
  const end = sale?.endsAt ? new Date(sale.endsAt) : null;
  const startLabel = format(start, "MMMM d, yyyy");
  if (!end || Number.isNaN(end.getTime()) || format(end, "yyyy-MM-dd") === format(start, "yyyy-MM-dd")) {
    return startLabel;
  }
  return `${format(start, "MMMM d")} - ${format(end, "MMMM d, yyyy")}`;
}
