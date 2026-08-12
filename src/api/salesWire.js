/**
 * THE ONE PLACE "WE CANNOT ANSWER" IS TOLD APART FROM "THE ANSWER IS NONE".
 *
 * The server half (22452, ledger rows 79 and 82) makes `GET /api/public/sales`
 * answer a misconfiguration honestly instead of cheerfully:
 *
 *   HTTP 503, cache-control: no-store
 *   { "ok": false, "degraded": "configuration",
 *     "message": "We could not load the sales list just now. Please try again or call us." }
 *
 *   `upcoming` and `past` are DELIBERATELY ABSENT from that body. A response
 *   saying "I cannot answer" and "here are your zero sales" in one breath is the
 *   same conflation one layer up.
 *
 * WHY THIS FILE EXISTS. That entire fix is worthless if the site turns a non-200
 * into a silent empty state, which is what a defensive consumer does by default.
 * The old reader did exactly that in one line — `asArray(data?.upcoming)` turns
 * an unreadable body into "no sales", confidently — and it is the same defect
 * `catalogWire.js` was written to close one endpoint over. There it was an absent
 * channel read as an empty catalog; here it is an unreachable feed read as a
 * business with nothing on. THIS TIME WE WOULD BE DISCARDING A SIGNAL THE SERVER
 * WENT OUT OF ITS WAY TO SEND.
 *
 * NO SALES IS A LIE WHEN THE TRUTH IS WE COULD NOT LOAD THEM.
 *
 * IF THE PLATFORM EVER CHANGES HOW IT SPELLS DEGRADATION, THIS FILE IS THE ONE
 * LINE THAT CHANGES. That is why it is a module and not a condition inside the
 * fetcher.
 *
 * No imports, so plain Node can exercise it — the `@` alias exists only in Vite.
 */

/** The feed answered. `upcoming` and `past` are the answer, empty or not. */
export const FEED_OK = "feed-ok";

/**
 * The feed could not answer. NOT an empty feed, and never to be rendered as one.
 * `reason` is for code and logs; `message` is for the person reading the page.
 */
export const FEED_DEGRADED = "feed-degraded";

/** Used when the server sent no sentence of its own. Never an empty string. */
export const DEFAULT_DEGRADED_MESSAGE =
  "We could not load the sales list just now. Please try again in a moment, or call us and we will tell you what is coming up.";

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

/**
 * Classifies one response into exactly one of two states.
 *
 * THE ORDER OF THESE QUESTIONS IS THE WHOLE DESIGN. Degradation is asked BEFORE
 * anything looks at `upcoming` or `past`, for the same reason `catalogWire` asks
 * presence before counting items: asking both as one question is what lets a
 * missing answer be reported as an empty one.
 *
 * @param {number} status  HTTP status.
 * @param {unknown} body   Parsed JSON body, or null if it could not be parsed.
 */
export function readSalesResponse(status, body) {
  const marker = isObject(body) ? text(body.degraded) : null;
  const message = isObject(body) ? text(body.message) : null;

  // The marker is authoritative wherever it appears. A 200 carrying `ok: false`
  // is a contract break, and the safe reading of a contract break is the one
  // that does not put words in the business's mouth.
  if (marker || (isObject(body) && body.ok === false)) {
    return degraded(marker || `http-${status}`, message);
  }

  if (status !== 200) {
    return degraded(`http-${status}`, message);
  }

  // A 200 whose body carries NEITHER array is not a quiet week — it is a
  // response we cannot read, and calling it empty is the original defect wearing
  // a success code. One array present is readable; the other is then genuinely
  // empty.
  if (!isObject(body) || (!Array.isArray(body.upcoming) && !Array.isArray(body.past))) {
    return degraded("unreadable", null);
  }

  return { state: FEED_OK, upcoming: asArray(body.upcoming), past: asArray(body.past) };
}

function degraded(reason, message) {
  return { state: FEED_DEGRADED, reason, message: message || DEFAULT_DEGRADED_MESSAGE };
}

/** True when this result must never be rendered as a list of sales. */
export const isDegraded = (result) => result?.state === FEED_DEGRADED;

/**
 * What a home-page sales section does with a result. A pure function because the
 * distinction it encodes is the thing worth gating, and a gate that needs a
 * browser to run is a gate that stops being run.
 *
 * `hidden` and `unavailable` MUST NEVER BE THE SAME VALUE: nothing scheduled is
 * not a failure and the section leaves the page, but a feed we could not read is
 * a fact the visitor is owed.
 *
 * `snapshot` IS THE ONE EXCEPTION, AND IT IS NOT A WEAKENING OF THAT RULE.
 * A build machine cannot reach the feed, so the prerenderer always gets a
 * degraded answer — and a degradation is true of one moment. Writing the notice
 * into a static file freezes that moment for every visitor until the next build:
 * the cached-503 hazard the platform sends `no-store` to avoid, except baked,
 * and outliving its cause by weeks on a site whose feed is fine. A snapshot
 * therefore says nothing, and the live client, which can actually reach the
 * feed, decides between the list and the notice.
 */
export function sectionMode(result, sales, { snapshot = false } = {}) {
  if (isDegraded(result)) return snapshot ? "hidden" : "unavailable";
  return asArray(sales).length === 0 ? "hidden" : "list";
}

/**
 * True while the prerenderer is capturing this page. Set by `prerender.mjs`
 * before navigation; absent in every real browser.
 */
export function isSnapshot() {
  return typeof globalThis !== "undefined" && globalThis.__C4IN_SNAPSHOT__ === true;
}

/**
 * What `/sale/:slug` does with a result. THE SHARPEST CASE ON THE SITE: with a
 * degraded feed the old page told a visitor holding a real link that the sale
 * does not exist. We do not know that. We know we could not look.
 */
export function salePageMode(result, sale) {
  if (isDegraded(result)) return "unavailable";
  return sale ? "sale" : "not-found";
}
