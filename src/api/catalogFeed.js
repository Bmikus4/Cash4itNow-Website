/**
 * Reading `GET /api/public/catalog?slug=…`, which is the answer to the question the sales feed
 * leaves open.
 *
 * `/api/public/sales` publishes each sale's catalogue as a REFERENCE — `{slug, itemCount}` — and
 * `catalogChannel.js` reads that as `CATALOG_PENDING`, the state whose whole meaning is *"the feed
 * told us there are forty items and did not send them"*. Nothing ever asked the second question, so
 * every real sale on the site has shown that sentence since launch while the platform sat on the
 * photographs, published, behind a route with no consumer.
 *
 * ## IT CAN ONLY EVER IMPROVE THE PAGE
 *
 * That is the rule this file is built to keep. `PENDING` is already an honest thing to say, so a
 * failed or refused lookup leaves it exactly where it was — **only a feed that actually answered
 * may move the page off it**, and the only two answers that do are "here are the items" and "this
 * catalogue is published and holds none".
 *
 * A 404 in particular does NOT become "no photos". The sales feed just said the sale has a
 * catalogue with items in it; a 404 here means that catalogue is not published yet, which is what
 * the pending sentence already tells the visitor. Reading it as emptiness would be the F3d defect
 * again — a confident false statement assembled out of two true ones.
 *
 * ## PURE, SO THE GATE CAN REACH IT
 *
 * No fetch, no react-query. `scripts/check-catalog-states.mjs` runs on every build and fails when
 * two of these states collapse into one, which is the regression this seam has already had once.
 */

import { normalisePublicItems } from "./catalogChannel.js";

/** The catalogue answered and the items are here. */
export const FEED_ITEMS = "items";

/** The catalogue answered and it holds nothing publishable. The one case that means empty. */
export const FEED_EMPTY = "empty";

/**
 * No published catalogue at that slug — HTTP 404.
 *
 * **Not the same as empty**, and the difference is the whole point: the sale carries a reference
 * saying items exist, so this means they are catalogued and not published. The page keeps saying
 * exactly that.
 */
export const FEED_UNPUBLISHED = "unpublished";

/**
 * We could not look. A 503 with no database, an unparseable body, an unreachable host, a shape
 * nobody recognises.
 *
 * The page says what it said before asking. **A failure to ask is never a fact about the world** —
 * the sale page's own comment on the sales feed makes the same point about "not found", and it is
 * the sharpest rule on this site.
 */
export const FEED_DEGRADED = "degraded";

/**
 * @param {number} status HTTP status; `0` for a request that never completed.
 * @param {unknown} body The parsed JSON body, or null when it could not be parsed.
 * @returns {{state: string, items: Array, count: number|null, reason: string|null}}
 */
export function readCatalogFeed(status, body) {
  const none = { state: FEED_DEGRADED, items: [], count: null, reason: null };

  if (status === 404) return { state: FEED_UNPUBLISHED, items: [], count: null, reason: "not_found" };
  if (status !== 200) return { ...none, reason: `http_${status || "unreachable"}` };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ...none, reason: "unreadable" };

  // The guard above established this; the annotation only lets the checker see it.
  const payload = /** @type {Record<string, any>} */ (body);

  /*
   * `ok: false` WITH A 200 IS STILL DEGRADED. The platform's routes carry `ok` alongside the
   * status and its own comment explains why: returning an empty `items` beside `ok: false` says "I
   * cannot answer" and "here are your zero items" in one breath, and a consumer that reads only the
   * array renders an empty sale as though it were real. This is that consumer, not reading only the
   * array.
   */
  if (payload.ok === false) return { ...none, reason: "not_ok" };

  if (!Array.isArray(payload.items)) return { ...none, reason: "no_items_array" };

  const items = normalisePublicItems(payload.items);
  if (items.length > 0) return { state: FEED_ITEMS, items, count: items.length, reason: null };

  /*
   * NO USABLE ITEM IS NOT AUTOMATICALLY AN EMPTY CATALOGUE. If the response carried entries and
   * none survived normalisation — every image missing, say — that is a delivery problem, and
   * calling it empty prints "no photos from this sale" over a catalogue full of them.
   * `catalogChannel.js` draws the same line for the inlined shape.
   */
  if (payload.items.length > 0) return { ...none, reason: "no_usable_items" };

  return { state: FEED_EMPTY, items: [], count: 0, reason: null };
}
