/**
 * `GET /api/public/catalog` RESPONSES, COPIED FROM THE HANDLER RATHER THAN FROM MEMORY.
 *
 * Every body below is the shape `apps/admin/app/api/public/catalog/route.ts` actually returns,
 * including the parts a fixture is most likely to "helpfully" tidy: the 503 carries `degraded` and
 * NOT `error`, the 404 carries `error` and not `degraded`, and neither carries an `items` key at
 * all. That absence is the platform's own ruling — an empty `items` beside `ok: false` says "I
 * cannot answer" and "here are your zero items" in one breath — so a fixture that added one would
 * quietly excuse a consumer that reads only the array.
 *
 * Shared by the gate and by the mock, like `salesWire.fixtures.js`. No imports: plain Node runs
 * these.
 */

/**
 * `image` varies per item, because in production it always does — every item's URL carries its own
 * image id. A fixture that gave three items one image would be a fixture whose success proves only
 * that the fixture works: the gallery deduped them into a single tile and the sale page showed one
 * photograph for a three-item catalogue. That is the shape of hazard this repository has already
 * paid for twice, most recently in `salesClient.js`'s mock.
 */
const item = (id, title, image) => ({
  id,
  title,
  description: "A fixture item.",
  category: "Furniture",
  condition: "Good",
  quantity: 1,
  askingPrice: "120.00",
  // RELATIVE ON PURPOSE. An absolute URL here would be a second place an origin is written down,
  // which `predeploy.mjs` correctly fails the build over.
  imageUrl: image,
});

/** The feed answering normally. */
export const healthyFeed = {
  status: 200,
  body: {
    ok: true,
    catalog: {
      title: "Shaler Collector Downsize",
      slug: "shaler-collector-downsize",
      description: "Militaria, sports cards, signs and advertising.",
      publishedAt: new Date(0).toISOString(),
      itemCount: 3,
    },
    items: [
      item("a", "Oak sideboard", "/hero-after.webp"),
      item("b", "Enamel sign", "/hero-before.webp"),
      item("c", "Record crate", "/img/0bf12dc53_generated_image.webp"),
    ],
  },
};

/**
 * A PUBLISHED CATALOGUE HOLDING NOTHING. The one case that genuinely means empty — the catalogue
 * answered and the answer was nothing.
 */
export const emptyFeed = {
  status: 200,
  body: {
    ok: true,
    catalog: { title: "Bethel Park Estate", slug: "bethel-park-estate", description: null, publishedAt: null, itemCount: 0 },
    items: [],
  },
};

/**
 * NOT PUBLISHED. Verbatim from the handler.
 *
 * **This must never read as empty.** The sale that sent us here carries a reference saying items
 * exist, so a 404 means they are catalogued and not yet public — which is exactly what the sale
 * page's pending sentence already says.
 */
export const unpublishedFeed = {
  status: 404,
  body: { ok: false, error: "not_found", message: "That catalog is not published." },
};

/** No database. `degraded: 'configuration'`, no `error` key, no `items` key. */
export const degradedFeed = {
  status: 503,
  body: {
    ok: false,
    degraded: "configuration",
    message: "We could not load this catalog just now. Please try again or call us.",
  },
};

/** A 200 whose body says it failed. Reading only `items` would render this as a real empty sale. */
export const okFalseWith200 = { status: 200, body: { ok: false, degraded: "configuration" } };

/**
 * Items were delivered and none of them is usable — every image missing. A delivery problem, not an
 * empty catalogue, and printing "no photos from this sale" over it would be the F3d defect wearing
 * the feed's clothes instead of the channel's.
 */
export const itemsAllUnusable = {
  status: 200,
  body: { ok: true, catalog: { slug: "x", itemCount: 2 }, items: [{ id: "a", title: "No image" }, { id: "b" }] },
};

/**
 * INTERNAL FIELDS PRESENT IN A PUBLIC PAYLOAD. They must not survive into anything the page can
 * render, and the gate asserts that — so a publication bug on the platform cannot leak them through
 * this consumer even if they arrive.
 */
export const withInternalFieldsPresent = {
  status: 200,
  body: {
    ok: true,
    catalog: { slug: "x", itemCount: 1 },
    items: [
      {
        id: "a",
        title: "Oak sideboard",
        imageUrl: "/hero-after.webp",
        containerDescription: "Master bedroom closet, top shelf",
        internalNotes: "Seller wants 300, will take 180",
      },
    ],
  },
};

/** A body that is not an object at all. */
export const unreadableBody = { status: 200, body: [1, 2, 3] };
