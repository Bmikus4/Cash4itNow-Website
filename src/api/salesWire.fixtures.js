/**
 * Response fixtures for the sales wire, shared by the gate and by the mock.
 *
 * `degradedConfiguration` is 22452's REPORTED shape, copied from
 * `fleet\drops\from_22452_sales_route_degradation_marker.md` rather than from
 * anyone's memory of the plan — including the deliberate ABSENCE of `upcoming`
 * and `past`, which is the part a fixture is most likely to "helpfully" add back.
 *
 * No imports: plain Node runs these.
 */

const sale = (slug, title) => ({
  slug,
  title,
  description: "Fixture sale.",
  imageUrl: "/hero-after.webp",
  city: "Mount Lebanon",
  state: "PA",
  startsAt: new Date(0).toISOString(),
  endsAt: new Date(0).toISOString(),
});

/** The feed answering normally. */
export const feedWithSales = {
  status: 200,
  body: { upcoming: [sale("a", "A")], past: [sale("b", "B")] },
};

/**
 * THE CASE THAT MUST NOT COLLAPSE INTO DEGRADED. A quiet week is a true answer,
 * and the section leaving the page is correct — nothing scheduled is not a
 * failure state.
 */
export const feedGenuinelyEmpty = { status: 200, body: { upcoming: [], past: [] } };

/** One list populated, the other legitimately empty. */
export const feedPartiallyEmpty = { status: 200, body: { upcoming: [], past: [sale("b", "B")] } };

/** 22452's shape, verbatim. `upcoming`/`past` absent on purpose. */
export const degradedConfiguration = {
  status: 503,
  body: {
    ok: false,
    degraded: "configuration",
    message: "We could not load the sales list just now. Please try again or call us.",
  },
};

/** A degradation the platform spells with a marker we have not seen before. */
export const degradedUnknownMarker = {
  status: 503,
  body: { ok: false, degraded: "some-future-reason", message: "Back shortly." },
};

/** A non-200 with no marker at all — still cannot answer. */
export const bareServerError = { status: 500, body: null };

/** A gateway page rather than JSON: body unparseable, status non-200. */
export const gatewayHtml = { status: 502, body: null };

/**
 * A 200 carrying neither array. The single most dangerous fixture here: the old
 * reader turned this into "no sales" with a success code, which is the defect
 * this seam exists to prevent, and it is the one a future normaliser will
 * reintroduce first.
 */
export const okButUnreadable = { status: 200, body: {} };

/** A 200 whose body is not an object at all. */
export const okButNotAnObject = { status: 200, body: "maintenance" };

/**
 * A contract break: success status, failure body. Rare, and the marker wins —
 * the reading that does not put words in the business's mouth.
 */
export const okWithFailureBody = {
  status: 200,
  body: { ok: false, degraded: "configuration", message: "We could not load the sales list just now." },
};
