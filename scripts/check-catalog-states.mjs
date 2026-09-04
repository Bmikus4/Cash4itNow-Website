/**
 * Proves the catalog seam distinguishes its states, and FAILS IF THEY COLLAPSE.
 *
 * The collapse is the whole defect. `if (!Array.isArray(catalog)) return []`
 * mapped absent, empty and reference-only onto one value, and the page then
 * printed a confident falsehood for two of the three. A checker that only
 * asserted "items render" would have passed against that code.
 *
 * So the assertions here are mostly about DISTINCTNESS rather than about values:
 * the last three cases below fail the moment two states become one, which is the
 * exact regression worth defending against — someone simplifying this back into
 * a normaliser that returns an array.
 */
import {
  readCatalog,
  CATALOG_ABSENT,
  CATALOG_EMPTY,
  CATALOG_PENDING,
  CATALOG_ITEMS,
} from "../src/api/catalogChannel.js";
import * as fixtures from "../src/api/catalogChannel.fixtures.js";
import {
  readCatalogFeed,
  FEED_ITEMS,
  FEED_EMPTY,
  FEED_UNPUBLISHED,
  FEED_DEGRADED,
} from "../src/api/catalogFeed.js";
import * as feedFixtures from "../src/api/catalogFeed.fixtures.js";

let failures = 0;
const check = (name, condition, detail) => {
  if (condition) process.stdout.write(`  ok    ${name}\n`);
  else {
    failures++;
    process.stderr.write(`  FAIL  ${name}\n        ${detail}\n`);
  }
};

process.stdout.write("CATALOG STATES\n");

// --- each fixture reads as the state it claims ------------------------------
const cases = [
  ["items inlined", fixtures.withItems, CATALOG_ITEMS],
  ["published and empty", fixtures.emptyChannel, CATALOG_EMPTY],
  ["empty array", fixtures.emptyArray, CATALOG_EMPTY],
  ["reference only (today's real feed)", fixtures.referenceOnly, CATALOG_PENDING],
  ["reference with no count", fixtures.referenceNoCount, CATALOG_PENDING],
  ["absent", fixtures.absent, CATALOG_ABSENT],
  ["absent (null)", fixtures.absentNull, CATALOG_ABSENT],
  ["present but uninformative object", fixtures.presentButUninformative, CATALOG_PENDING],
  ["present empty object {}", fixtures.presentEmptyObject, CATALOG_PENDING],
  ["items present but none usable", fixtures.itemsAllUnusable, CATALOG_PENDING],
];
for (const [name, input, expected] of cases) {
  const actual = readCatalog(input).state;
  check(name, actual === expected, `expected ${expected}, got ${actual}`);
}

// --- the distinctions, stated as distinctions -------------------------------
{
  const absent = readCatalog(fixtures.absent).state;
  const empty = readCatalog(fixtures.emptyChannel).state;
  const pending = readCatalog(fixtures.referenceOnly).state;
  check(
    "absent != empty",
    absent !== empty,
    "an absent channel read as an empty catalog is F3d: the page says 'no photos yet' about an API that has never existed"
  );
  check(
    "reference-only != empty",
    pending !== empty,
    "the feed said this catalog holds items; reporting it as empty tells a visitor the opposite of what we were told"
  );
  check(
    "reference-only != absent",
    pending !== absent,
    "a published catalog we cannot yet read items from is not the same as no catalog, and the page should say different things about them"
  );
  check(
    "three non-item states stay three",
    new Set([absent, empty, pending]).size === 3,
    "two states have collapsed into one — that collapse IS the defect this module exists to prevent"
  );
}

// --- THE WIRE RULING (ledger row 59) ----------------------------------------
//
// The distinction states 2 and 3 hang from, asserted at the wire rather than at
// the outputs. Written this way ON PURPOSE: the collapse returned once from a
// defensive convenience inside the reader, so a test that only checks four
// output values would pass again the moment someone re-added
// `if (!recognised) return []`. These assert the RULE.
{
  const absent = readCatalog(fixtures.absent);
  const absentNull = readCatalog(fixtures.absentNull);
  const emptyPublished = readCatalog(fixtures.emptyChannel);
  const presentBare = readCatalog(fixtures.presentEmptyObject);

  check(
    "RULING: absent means NO ITEM CHANNEL",
    absent.state === CATALOG_ABSENT && absentNull.state === CATALOG_ABSENT,
    "ledger row 59: omission and null both mean nothing has ever been published"
  );
  check(
    "RULING: present means the channel EXISTS",
    presentBare.state !== CATALOG_ABSENT,
    "a present `catalog` field was read as no channel. Row 59: present is present — only omission or null may claim nothing was ever published. See fleet/briefs/c4in-website-catalog-wire-ruling.md"
  );
  check(
    "RULING: absent and published-and-empty are DIFFERENT FACTS",
    absent.state !== emptyPublished.state,
    "states 2 and 3 have collapsed. A page saying 'no photos from this sale' when the truth is 'not published yet' tells the visitor the opposite of what is true, confidently. This is F3d returning. See ledger row 59"
  );
  check(
    "RULING: the three spellings are not equivalent",
    new Set([absent.state, emptyPublished.state, presentBare.state]).size === 3,
    "omission, an empty array and `{}` must produce three different answers; treating them as one is how a contract stops being a contract"
  );
}

// --- unreadable payloads are a contract break, not an empty catalog ---------
for (const [name, input] of [
  ["string", fixtures.wireViolationString],
  ["number", fixtures.wireViolationNumber],
  ["boolean", fixtures.wireViolationBoolean],
]) {
  const read = readCatalog(input);
  check(
    `wire violation (${name}) is flagged, not laundered`,
    read.state === CATALOG_ABSENT && typeof read.violation === "string" && read.violation.includes("row 59"),
    "an unreadable payload must carry a violation naming the ruling; silently reading it as 'no channel' hides a contract break as a normal empty state"
  );
  check(`wire violation (${name}) renders nothing`, read.items.length === 0, "the page must say nothing rather than guess");
}

// --- the count is evidence, not a default -----------------------------------
{
  const unknown = readCatalog(fixtures.referenceNoCount).count;
  const known = readCatalog(fixtures.referenceOnly).count;
  check("unknown count is null, not 0", unknown === null, `got ${unknown} — printing an unknown count as "0 items" is a claim we cannot support`);
  check("known count is carried", known === 40, `got ${known}`);
}

// --- internal fields never survive, and broken items never render -----------
{
  const read = readCatalog(fixtures.withInternalFieldsPresent);
  const serialised = JSON.stringify(read.items);
  check("usable item kept, unusable dropped", read.items.length === 1, `got ${read.items.length} items`);
  check(
    "containerDescription never reaches the page",
    !serialised.includes("containerDescription") && !serialised.includes("Box 4"),
    "an internal field survived normalisation; the platform's allowlist would be the only thing standing between it and a public page"
  );
  check(
    "internalNotes never reaches the page",
    !serialised.includes("internalNotes") && !serialised.includes("Chipped leg"),
    "an internal note survived normalisation"
  );
  check(
    "every rendered item has an image",
    read.items.every((item) => typeof item.imageUrl === "string" && item.imageUrl.length),
    "an item without an image would render as a broken tile"
  );
}

// =============================================================================
// THE SECOND HALF OF THE SEAM: what /api/public/catalog answered.
//
// The channel above says whether a sale HAS a catalogue; this says what one
// HOLDS. The states have to stay as distinct here as they are up there, and for
// the same reason -- collapsing a refusal into an emptiness prints a confident
// falsehood over a catalogue full of photographs.
// =============================================================================
process.stdout.write("CATALOG FEED\n");

const feedCases = [
  ["items published", feedFixtures.healthyFeed, FEED_ITEMS],
  ["published and empty", feedFixtures.emptyFeed, FEED_EMPTY],
  ["not published (404)", feedFixtures.unpublishedFeed, FEED_UNPUBLISHED],
  ["no database (503)", feedFixtures.degradedFeed, FEED_DEGRADED],
  ["ok:false with a 200", feedFixtures.okFalseWith200, FEED_DEGRADED],
  ["items delivered, none usable", feedFixtures.itemsAllUnusable, FEED_DEGRADED],
  ["body is not an object", feedFixtures.unreadableBody, FEED_DEGRADED],
];
for (const [name, fixture, expected] of feedCases) {
  const actual = readCatalogFeed(fixture.status, fixture.body).state;
  check(name, actual === expected, `expected ${expected}, got ${actual}`);
}

check(
  "an unreachable request is degraded, not empty",
  readCatalogFeed(0, null).state === FEED_DEGRADED,
  "a request that never completed is not a fact about the catalogue"
);

// --- the distinctions, stated as distinctions -------------------------------
{
  const unpublished = readCatalogFeed(feedFixtures.unpublishedFeed.status, feedFixtures.unpublishedFeed.body).state;
  const empty = readCatalogFeed(feedFixtures.emptyFeed.status, feedFixtures.emptyFeed.body).state;
  const degraded = readCatalogFeed(feedFixtures.degradedFeed.status, feedFixtures.degradedFeed.body).state;
  check(
    "not published != empty",
    unpublished !== empty,
    "a 404 read as an empty catalogue prints 'no photos from this sale' about photographs the sales feed just said exist"
  );
  check(
    "degraded != empty",
    degraded !== empty,
    "a failure to ask read as an emptiness is the F3d defect: a claim about the world made from a broken request"
  );
  check(
    "degraded != not published",
    degraded !== unpublished,
    "we could not look and it is not there are different answers, and only one of them is ours to state"
  );
}

// --- only an answer moves the page off PENDING ------------------------------
{
  const movesThePage = (state) => state === FEED_ITEMS || state === FEED_EMPTY;
  check(
    "only ITEMS and EMPTY may change what the page says",
    !movesThePage(FEED_UNPUBLISHED) && !movesThePage(FEED_DEGRADED),
    "PENDING is already an honest sentence; a lookup that failed must leave it exactly where it was"
  );
}

// --- internal fields never survive the feed either --------------------------
{
  const read = readCatalogFeed(
    feedFixtures.withInternalFieldsPresent.status,
    feedFixtures.withInternalFieldsPresent.body
  );
  const serialised = JSON.stringify(read.items);
  check("the published item renders", read.items.length === 1, `got ${read.items.length} items`);
  check(
    "containerDescription never reaches the page from the feed",
    !serialised.includes("containerDescription") && !serialised.includes("Master bedroom"),
    "the feed path must obey the same allowlist as the channel path; they share one normaliser so that it cannot drift"
  );
  check(
    "internalNotes never reaches the page from the feed",
    !serialised.includes("internalNotes") && !serialised.includes("will take 180"),
    "an internal note survived normalisation on the feed path"
  );
}

process.stdout.write(failures ? `CATALOG STATES: ${failures} failed\n` : "CATALOG STATES: all states distinct, nothing internal leaks\n");
process.exitCode = failures ? 1 : 0;
