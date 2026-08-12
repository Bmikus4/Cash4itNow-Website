/**
 * The Event graph, kept in its own module WITH NO IMPORTS so it can be exercised
 * from plain Node by scripts/check-event-schema.mjs.
 *
 * Same reason src/lib/origins.js takes an env bag and src/api/catalogChannel.js
 * is pure: the `@` alias exists only inside Vite, so anything a build-time check
 * needs to reason about cannot reach for it. The origin is a parameter for
 * exactly this reason — structuredData.js supplies the real one.
 */

/**
 * One upcoming sale as an Event. §8.3 calls this the highest-value structured
 * data the site can emit, because it is what puts a sale in a search result with
 * its dates attached rather than as a plain blue link.
 *
 * RETURNS NULL RATHER THAN A PARTIAL EVENT. A sale with no usable start date
 * emits nothing at all. An Event without a `startDate` is not a lesser Event —
 * it is a malformed claim handed to a machine that will republish it, and a
 * consumer that cannot read a date is free to invent its own or to drop the
 * record silently. Absent beats guessed, the same rule the answer pages run on.
 *
 * ONLY WHAT THE FEED ACTUALLY CARRIES. No `offers`, no price, no invented end
 * time, no `eventStatus`: the feed has no status field, so emitting
 * `EventScheduled` would assert this sale is not cancelled — a fact nobody here
 * holds. A consumer assumes scheduled anyway, so the claim buys nothing and
 * could be false.
 *
 * @param sale a Sale from the feed's `upcoming` list
 * @param origin the canonical site origin
 */
export function saleEventGraph(sale, origin) {
  if (!sale || typeof sale.slug !== "string" || !sale.slug) return null;

  // The single gate on emitting at all. Date.parse rather than trusting the
  // string: a malformed date reaching a search engine as "startDate" is worse
  // than no Event, and the feed's dates are strings we did not write.
  const start = sale.startsAt ? new Date(sale.startsAt) : null;
  if (!start || Number.isNaN(start.getTime())) return null;

  const end = sale.endsAt ? new Date(sale.endsAt) : null;
  const url = `${origin}/sale/${sale.slug}`;

  const graph = {
    "@context": "https://schema.org",
    // Multi-typed on purpose: SaleEvent is what this actually is, and Event is
    // what a consumer doing an exact-match on the common type will look for.
    // Dropping either would lose one of those two audiences.
    "@type": ["Event", "SaleEvent"],
    "@id": `${url}#event`,
    name: sale.title,
    startDate: start.toISOString(),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: { "@id": `${origin}/#business` },
  };

  if (end && !Number.isNaN(end.getTime())) graph.endDate = end.toISOString();
  if (sale.description) graph.description = sale.description;
  if (sale.imageUrl) graph.image = sale.imageUrl.startsWith("http") ? sale.imageUrl : `${origin}${sale.imageUrl}`;

  // ============================================================
  // CITY AND STATE ONLY. NEVER `streetAddress`. NOT A PREFERENCE.
  // ============================================================
  // The sale contract withholds a sale's street address until 48 hours before
  // the doors open. This field is the worst possible place for it to leak from,
  // because a structured-data claim is fetched once, cached, and republished by
  // machines we do not control — A CACHED SNIPPET OUTLIVES THE PAGE, so a leak
  // here cannot be taken back by editing the site.
  //
  // Do not "complete" this address, whichever way the feed later carries one.
  // If a `streetAddress` field ever appears on Sale, it still does not go here.
  const address = {};
  if (sale.city) address.addressLocality = sale.city;
  if (sale.state) {
    address.addressRegion = sale.state;
    // Derived from the state, not guessed at: a US state code implies the
    // country, and an address with no country is ambiguous to a consumer that
    // has to place it on a map.
    address.addressCountry = "US";
  }
  if (Object.keys(address).length) {
    graph.location = { "@type": "Place", name: [sale.city, sale.state].filter(Boolean).join(", "), address: { "@type": "PostalAddress", ...address } };
  }

  return graph;
}

/**
 * Every upcoming sale as Events, for a page that lists them. Returns null rather
 * than an empty array so `useJsonLd` emits no script at all when there is
 * nothing to say — an empty JSON-LD array is a claim that there are no events,
 * which is not the same as having no data.
 *
 * `sales` is the feed's own `upcoming` list. UPCOMING IS THE FEED'S
 * CLASSIFICATION, NOT OURS: re-deriving it here from dates would be a second
 * source of truth that could disagree with the list the page is rendering, and
 * the page and its structured data must describe the same thing.
 */
export function saleEventsGraph(sales, origin) {
  const events = (sales ?? []).map((sale) => saleEventGraph(sale, origin)).filter(Boolean);
  return events.length ? events : null;
}

