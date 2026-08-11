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
  ["not a catalog", fixtures.garbage, CATALOG_ABSENT],
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

process.stdout.write(failures ? `CATALOG STATES: ${failures} failed\n` : "CATALOG STATES: all states distinct, nothing internal leaks\n");
process.exitCode = failures ? 1 : 0;
