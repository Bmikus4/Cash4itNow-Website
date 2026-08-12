/**
 * Proves the Event graph is emitted only when it can be emitted truthfully, and
 * that it never carries a street address.
 *
 * TWO FAILURES THIS DEFENDS AGAINST, and they are not the same shape:
 *
 *   1. A PARTIAL Event. Missing or unparseable dates must produce NOTHING. An
 *      Event without a startDate is not a lesser Event — it is a malformed claim
 *      handed to a machine that republishes it, and the machine is free to
 *      invent a date or drop the record silently. Absent beats guessed.
 *   2. A LEAKED ADDRESS. The sale contract withholds a street address until 48
 *      hours before doors. Structured data is the worst place for it to escape,
 *      because it is fetched once, cached, and republished by consumers we do
 *      not control — a cached snippet outlives the page, so the leak cannot be
 *      taken back by editing the site. The last case below feeds in a sale that
 *      carries a street address anyway and requires it not to survive.
 *
 * Runs under plain Node against the real graph builder, no browser needed.
 */
// eventGraph.js and NOT structuredData.js: the latter imports through the `@`
// alias, which exists only inside Vite. Every field here is exercised through
// the same function the app calls; structuredData only supplies the origin.
import { saleEventGraph, saleEventsGraph } from "../src/lib/eventGraph.js";

let failures = 0;
const check = (name, condition, detail) => {
  if (condition) process.stdout.write(`  ok    ${name}\n`);
  else {
    failures++;
    process.stderr.write(`  FAIL  ${name}\n        ${detail}\n`);
  }
};

process.stdout.write("EVENT SCHEMA\n");

const complete = {
  slug: "mount-lebanon-full-estate",
  title: "Mount Lebanon Full Estate",
  description: "Three floors and a full basement.",
  imageUrl: "/hero-before.webp",
  city: "Mount Lebanon",
  state: "PA",
  startsAt: "2026-09-01T13:00:00.000Z",
  endsAt: "2026-09-03T20:00:00.000Z",
};

// --- emitted when it can be emitted truthfully ------------------------------
{
  const g = saleEventGraph(complete, "https://example.test");
  check("complete sale emits an Event", !!g, "returned null");
  check("typed as both Event and SaleEvent", JSON.stringify(g["@type"]) === '["Event","SaleEvent"]', `got ${JSON.stringify(g["@type"])}`);
  check("startDate present and ISO", g.startDate === "2026-09-01T13:00:00.000Z", `got ${g.startDate}`);
  check("endDate present when the feed gave one", g.endDate === "2026-09-03T20:00:00.000Z", `got ${g.endDate}`);
  check("@id is stable and page-scoped", g["@id"] === "https://example.test/sale/mount-lebanon-full-estate#event", `got ${g["@id"]}`);
  check("organizer references the business graph", g.organizer?.["@id"] === "https://example.test/#business", `got ${JSON.stringify(g.organizer)}`);
  check("relative image absolutised", g.image === "https://example.test/hero-before.webp", `got ${g.image}`);
  check("city and state in the address", g.location?.address?.addressLocality === "Mount Lebanon" && g.location?.address?.addressRegion === "PA", JSON.stringify(g.location));
  check("no offers", g.offers === undefined, "an offers block would state a price nobody has");
  check("no eventStatus", g.eventStatus === undefined, "the feed has no status field, so EventScheduled would assert this sale is not cancelled");
}

// --- NOTHING, rather than something partial ---------------------------------
for (const [name, sale] of [
  ["no startsAt", { ...complete, startsAt: undefined }],
  ["null startsAt", { ...complete, startsAt: null }],
  ["empty startsAt", { ...complete, startsAt: "" }],
  ["unparseable startsAt", { ...complete, startsAt: "next Thursday" }],
  ["no slug", { ...complete, slug: undefined }],
  ["nothing at all", undefined],
]) {
  check(`${name} emits NO Event`, saleEventGraph(sale, "https://example.test") === null, "a partial Event is a malformed claim to a machine that will republish it");
}

// --- an unparseable end date does not poison an otherwise good Event --------
{
  const g = saleEventGraph({ ...complete, endsAt: "sometime" }, "https://example.test");
  check("bad endDate drops the field, keeps the Event", !!g && g.endDate === undefined, JSON.stringify(g?.endDate));
}

// --- THE ADDRESS MUST NEVER SURVIVE -----------------------------------------
{
  const withStreet = { ...complete, streetAddress: "14 Example Street", address: "14 Example Street, Mount Lebanon PA" };
  const serialised = JSON.stringify(saleEventGraph(withStreet, "https://example.test"));
  check(
    "a street address on the sale does not reach the graph",
    !serialised.includes("streetAddress") && !serialised.includes("14 Example Street"),
    "THE ADDRESS LEAKED. A cached snippet outlives the page and cannot be taken back"
  );
}

// --- the list form ----------------------------------------------------------
{
  check("empty list emits nothing", saleEventsGraph([], "https://example.test") === null, "an empty array claims there are no upcoming sales, which is not the same as having no data");
  check("undefined emits nothing", saleEventsGraph(undefined, "https://example.test") === null, "");
  const mixed = saleEventsGraph([complete, { ...complete, slug: "b", startsAt: null }], "https://example.test");
  check("a bad sale is dropped, the good one survives", Array.isArray(mixed) && mixed.length === 1, `got ${JSON.stringify(mixed?.length)}`);
}

// --- no review data, ever ---------------------------------------------------
{
  const serialised = JSON.stringify(saleEventGraph(complete, "https://example.test"));
  check(
    "no Review or AggregateRating",
    !/Review|AggregateRating|reviewer/i.test(serialised),
    "the testimonials must never become machine-readable in any form"
  );
}

process.stdout.write(failures ? `EVENT SCHEMA: ${failures} failed\n` : "EVENT SCHEMA: emitted only when truthful, no address, no invented fields\n");
process.exitCode = failures ? 1 : 0;
