/**
 * THE CONTRACT AS THE WEBSITE UNDERSTANDS IT, written as data.
 *
 * This is the artifact that gets carried to the terminal building the
 * publication API, alongside fleet/drops/c4in-catalog-contract-proposal.md. A
 * fixture is a better contract than prose because it can be run: the checker in
 * scripts/check-catalog-states.mjs asserts each of these reads as the state it
 * claims, and fails if two states collapse into one.
 *
 * NOT BUNDLED. Only the checker imports it — no app code does — so it never
 * reaches the browser.
 *
 * IMAGE PATHS ARE RELATIVE ON PURPOSE. An absolute URL here would be a second
 * place an origin is written down, which the build gate correctly forbids
 * anywhere but src/lib/origins.js.
 *
 * WHAT THE PAGE ACTUALLY RENDERS, and therefore all it asks for: an id, one
 * image, and a title. Nothing else is needed and nothing else should be sent —
 * `containerDescription` and `internalNotes` are internal and must never appear
 * in a public payload. `withInternalFieldsPresent` exists to prove this consumer
 * drops them even if a publication bug lets them through, so that the allowlist
 * at the platform's end is a second line of defence rather than the only one.
 */

/** Items inlined and renderable — what the page needs to draw a gallery. */
export const withItems = {
  slug: "estate-of-mount-lebanon",
  itemCount: 3,
  items: [
    { id: "itm_1", imageUrl: "/img/sample-1.webp", title: "Griswold cast iron skillet" },
    { id: "itm_2", imageUrl: "/img/sample-2.webp", title: "Mid-century walnut credenza" },
    { id: "itm_3", imageUrl: "/img/sample-3.webp", title: "" },
  ],
};

/** A published catalog that genuinely holds nothing. Empty means empty. */
export const emptyChannel = { slug: "estate-of-carnegie", itemCount: 0, items: [] };

/** The same, expressed as a bare empty array — the mock's way of saying it. */
export const emptyArray = [];

/**
 * TODAY'S REAL FEED SHAPE. A reference: the catalog exists and says it holds 40
 * items, and this response carries none of them. Reading this as "no photos" is
 * the F3d defect in one line.
 */
export const referenceOnly = { slug: "estate-of-sewickley", itemCount: 40 };

/** A reference with no count either. Still not an empty catalog. */
export const referenceNoCount = { slug: "estate-of-shadyside" };

/** No catalog published for this sale at all. */
export const absent = undefined;

/** The field is present but null — same meaning as absent, and it occurs. */
export const absentNull = null;

/**
 * A PRESENT object carrying nothing we recognise. Under ledger row 59 this is a
 * channel that EXISTS — present is present — so it reads as pending, not absent.
 * Before that ruling it read as absent, which reported a live channel as no
 * channel. Renamed from `garbage` because it is not garbage: it is a legitimate
 * spelling of "the channel exists and this response carries nothing".
 */
export const presentButUninformative = { unrelated: true };

/** `{}` — the third spelling the ruling forbids treating as "not published". */
export const presentEmptyObject = {};

/**
 * Shapes the contract does not define at all. NOT absent: absent is a fact the
 * wire stated, these are the wire saying something unreadable, and conflating
 * them would hide a contract break as a normal empty state.
 */
export const wireViolationString = "published";
export const wireViolationNumber = 40;
export const wireViolationBoolean = true;

/**
 * A publication bug: internal fields present, plus one item whose image is
 * missing entirely. The consumer must keep the good item, drop the broken one,
 * and carry neither internal field forward.
 */
export const withInternalFieldsPresent = {
  slug: "estate-of-regent-square",
  itemCount: 2,
  items: [
    {
      id: "itm_9",
      imageUrl: "/img/sample-9.webp",
      title: "Oak dining table",
      containerDescription: "Box 4, garage shelf B",
      internalNotes: "Chipped leg, price down from 220",
    },
    { id: "itm_10", title: "No photograph taken" },
  ],
};

/**
 * Items delivered but none usable, while the count insists there are two. A
 * delivery problem, not an empty catalog — the page must not apologise for a
 * catalog that says it is full.
 */
export const itemsAllUnusable = {
  slug: "estate-of-bloomfield",
  itemCount: 2,
  items: [{ title: "no image" }, null],
};
