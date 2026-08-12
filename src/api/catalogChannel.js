/**
 * The website's side of the catalog publication seam (F3d).
 *
 * THE DEFECT THIS REPLACES. `catalogEntries()` did `if (!Array.isArray(catalog))
 * return []` and the sale page rendered "No photos yet — check back closer to
 * the sale date" for that empty array. The real feed publishes `catalog` as a
 * REFERENCE ({slug, itemCount}), never an array, so that branch was reached for
 * every real sale: a page telling visitors there are no photographs yet, when in
 * fact the channel that would carry them has never existed. A defensive
 * normaliser turned an absent channel into a confident false statement.
 *
 * It was invisible in development because VITE_SALES_MOCK sends an array. That
 * is the Base44-stub shape again — a stub whose success proves only that the
 * stub works.
 *
 * SO THE RULE HERE: this module never guesses. Every branch below is a state the
 * website can distinguish from evidence, and where it cannot tell, it says so
 * rather than defaulting to the reassuring answer. An absent channel is NOT an
 * empty catalog. The page's job is then to make no claim it cannot support.
 *
 * PRESENCE IS NOT DECIDED HERE. `src/api/catalogWire.js` owns how the wire
 * spells "no item channel" versus "a channel that exists", per ledger row 59.
 * This file decides only what a PRESENT channel holds. Keeping the two apart is
 * the fix: asking them as one question is what let a missing channel be reported
 * as an empty one.
 *
 * IT DOES NOT OWN THE CONTRACT. The publication API (Phase 4) owns it. This
 * reads defensively enough to survive whichever shape lands, and every field
 * name it looks for that is not already in the live feed is marked PROVISIONAL
 * below. The proposal carried to that terminal is
 * fleet/drops/c4in-catalog-contract-proposal.md.
 */

import { channelPresence, wireViolationMessage, CHANNEL_ABSENT, CHANNEL_UNRECOGNISED } from "./catalogWire.js";

/** No `catalog` on the sale at all. The channel has published nothing for it. */
export const CATALOG_ABSENT = "absent";

/** A catalog exists and is empty. A real, publishable fact about a real sale. */
export const CATALOG_EMPTY = "empty";

/**
 * A catalog exists and says it holds items, but this response does not carry
 * them — today's `{slug, itemCount}` reference is exactly this.
 *
 * THIS IS THE STATE THAT MAKES F3d F3d, and it is the one the brief's three did
 * not name: it is neither "items present" nor "empty", and collapsing it into
 * either is a false statement rather than a missing feature. Saying "no photos"
 * when the feed just told us there are 40 is the worst of the three lies
 * available.
 */
export const CATALOG_PENDING = "pending";

/** Items are present and renderable. */
export const CATALOG_ITEMS = "items";

/**
 * PROVISIONAL — the platform has not agreed these names.
 *
 * Both are read only as fallbacks, never required: `items` is where an inlined
 * array would most naturally sit, and `itemCount` is the one field today's
 * reference already carries. If the publication API names them otherwise, this
 * list is the only thing that changes.
 */
const ITEMS_KEYS = ["items", "entries"];
const COUNT_KEYS = ["itemCount", "count"];

const firstKey = (object, keys) => keys.find((key) => object[key] !== undefined);

/**
 * Accepts a bare image URL or an object carrying one, and skips anything else
 * rather than rendering a broken tile. Only what the page actually draws is
 * taken: an id if there is one, a title, and one image.
 *
 * NOTHING INTERNAL IS READ HERE, and that is deliberate rather than incidental —
 * `containerDescription` and `internalNotes` exist on the platform's side and
 * must never reach a public page. Not reading them means a publication bug
 * cannot leak them through this consumer even if they arrive.
 */
function normaliseItem(entry, index) {
  if (typeof entry === "string") return entry ? { id: `i${index}`, imageUrl: entry, title: "" } : null;
  if (!entry || typeof entry !== "object") return null;
  const imageUrl = entry.imageUrl || entry.image || entry.url;
  if (typeof imageUrl !== "string" || !imageUrl) return null;
  return {
    id: typeof entry.id === "string" || typeof entry.id === "number" ? String(entry.id) : `i${index}`,
    imageUrl,
    title: typeof entry.title === "string" ? entry.title : "",
  };
}

/**
 * Reads a sale's `catalog` into exactly one state plus whatever evidence
 * supports it.
 *
 * @returns {{state: string, items: Array, count: number|null, reference: string|null}}
 *   `count` is null when the feed did not say — which is different from 0, and
 *   the page must not print an unknown count as "0 items".
 */
export function readCatalog(catalog) {
  const none = { state: CATALOG_ABSENT, items: [], count: null, reference: null };

  // PRESENCE IS DECIDED IN ONE PLACE — src/api/catalogWire.js — and it is asked
  // BEFORE anything looks at items or counts. Mixing "is there a channel" with
  // "what does it hold" is precisely what let a missing channel be reported as
  // an empty one. See ledger row 59.
  const presence = channelPresence(catalog);

  if (presence === CHANNEL_ABSENT) return none;

  if (presence === CHANNEL_UNRECOGNISED) {
    // Loud, and then silent on the page. A payload we cannot read is a contract
    // break, not an empty catalog, so it must not be laundered into one — but a
    // sale page must still render, and saying nothing is the only response that
    // cannot be a lie.
    if (typeof console !== "undefined") console.error(`[catalog] ${wireViolationMessage(catalog)}`);
    return { ...none, violation: wireViolationMessage(catalog) };
  }

  // An inlined array: the mock's shape today, and a plausible published shape.
  if (Array.isArray(catalog)) {
    const items = catalog.map(normaliseItem).filter(Boolean);
    if (items.length) return { state: CATALOG_ITEMS, items, count: items.length, reference: null };
    // An empty ARRAY is a real empty catalog — the channel answered and the
    // answer was nothing. This is the one case where empty means empty.
    return { state: CATALOG_EMPTY, items: [], count: 0, reference: null };
  }

  // No non-object guard here on purpose: channelPresence() has already ruled
  // anything that is not an array or an object UNRECOGNISED. A second guard
  // returning `none` would quietly re-map a contract break onto "no channel",
  // which is the exact laundering row 59 forbids.

  const reference = typeof catalog.slug === "string" && catalog.slug ? catalog.slug : null;
  const itemsKey = firstKey(catalog, ITEMS_KEYS);
  const countKey = firstKey(catalog, COUNT_KEYS);
  const rawCount = countKey ? catalog[countKey] : undefined;
  const count = Number.isFinite(rawCount) ? Number(rawCount) : null;

  if (itemsKey && Array.isArray(catalog[itemsKey])) {
    const items = catalog[itemsKey].map(normaliseItem).filter(Boolean);
    if (items.length) return { state: CATALOG_ITEMS, items, count: count ?? items.length, reference };
    // Items were delivered and none survived normalisation. If the count says
    // there should have been some, that is a delivery problem, not an empty
    // catalog — do not report it as empty.
    if (count && count > 0) return { state: CATALOG_PENDING, items: [], count, reference };
    return { state: CATALOG_EMPTY, items: [], count: 0, reference };
  }

  // A reference with no items. The channel exists; this response does not carry
  // what the page needs.
  if (reference || count !== null) {
    if (count === 0) return { state: CATALOG_EMPTY, items: [], count: 0, reference };
    return { state: CATALOG_PENDING, items: [], count, reference };
  }

  // A PRESENT object carrying no items, no count and no slug. Under the ruling
  // this is still a channel that exists, so it is PENDING and not absent: the
  // feed chose to send a catalog field, and "nothing has ever been published"
  // is a claim only omission or null may make. This line is the ruling's
  // sharpest edge — before row 59 it returned absent, which reported a live
  // channel as no channel.
  return { state: CATALOG_PENDING, items: [], count: null, reference: null };
}
