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

// The origin comes from src/lib/origins.js and nowhere else: a second copy of it
// is what let the CSP and the actual request target drift apart.
const ENDPOINT = import.meta.env.VITE_SALES_ENDPOINT || resolveOrigins(import.meta.env).salesEndpoint;
const USE_MOCK = import.meta.env.VITE_SALES_MOCK === "1";

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
      catalog: [],
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
      catalog: [],
    },
  ],
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export async function fetchSales() {
  if (USE_MOCK) return MOCK;

  const response = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`sales endpoint returned ${response.status}`);
  const data = await response.json();
  return { upcoming: asArray(data?.upcoming), past: asArray(data?.past) };
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
