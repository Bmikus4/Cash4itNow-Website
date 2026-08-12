/**
 * Proves the sales feed's "we cannot answer" never collapses into "there are no
 * sales", AND FAILS IF THEY EVER RENDER THE SAME.
 *
 * The collapse is the whole defect, and it had a one-line spelling:
 * `asArray(data?.upcoming)` turned any unreadable body into an empty list with a
 * success code. The platform now spends a 503, a marker and a log saying it
 * cannot answer (22452, ledger rows 79 and 82); a consumer that shrugs that into
 * an empty state throws all of it away and tells a customer this business has
 * nothing on.
 *
 * So the assertions are mostly about DISTINCTNESS rather than values — the same
 * shape as `check-catalog-states.mjs`, for the same reason. A checker asserting
 * only "sales render" passes against the defective code.
 */
import {
  readSalesResponse,
  sectionMode,
  salePageMode,
  FEED_OK,
  FEED_DEGRADED,
} from "../src/api/salesWire.js";
import * as fixtures from "../src/api/salesWire.fixtures.js";

let failures = 0;
let checks = 0;
const check = (name, condition, detail) => {
  checks++;
  if (condition) process.stdout.write(`  ok    ${name}\n`);
  else {
    failures++;
    process.stderr.write(`  FAIL  ${name}\n        ${detail}\n`);
  }
};

process.stdout.write("DEGRADED STATES\n");

const read = (f) => readSalesResponse(f.status, f.body);

// --- each fixture reads as the state it claims -------------------------------
const cases = [
  ["feed with sales", fixtures.feedWithSales, FEED_OK],
  ["feed genuinely empty", fixtures.feedGenuinelyEmpty, FEED_OK],
  ["feed partially empty", fixtures.feedPartiallyEmpty, FEED_OK],
  ["degraded: configuration (the platform's real shape)", fixtures.degradedConfiguration, FEED_DEGRADED],
  ["degraded: marker we have not seen before", fixtures.degradedUnknownMarker, FEED_DEGRADED],
  ["bare 500, no body", fixtures.bareServerError, FEED_DEGRADED],
  ["502 gateway page, unparseable", fixtures.gatewayHtml, FEED_DEGRADED],
  ["200 carrying neither array", fixtures.okButUnreadable, FEED_DEGRADED],
  ["200 whose body is not an object", fixtures.okButNotAnObject, FEED_DEGRADED],
  ["200 with a failure body (contract break)", fixtures.okWithFailureBody, FEED_DEGRADED],
];
for (const [name, fixture, expected] of cases) {
  const actual = read(fixture).state;
  check(name, actual === expected, `expected ${expected}, got ${actual}`);
}

// --- the distinctions, stated as distinctions --------------------------------
{
  const degraded = read(fixtures.degradedConfiguration).state;
  const empty = read(fixtures.feedGenuinelyEmpty).state;
  check(
    "degraded != genuinely empty",
    degraded !== empty,
    "a degraded feed read as an empty one is the defect this seam exists to prevent: the page tells a customer there are no sales when the truth is we could not load them"
  );

  const unreadable = read(fixtures.okButUnreadable).state;
  check(
    "200-but-unreadable != genuinely empty",
    unreadable !== empty,
    "a 200 carrying neither array is a response we cannot read, not a quiet week; calling it empty is the original one-line defect wearing a success code"
  );
}

// --- a degraded result never fabricates the lists it does not have -----------
{
  const result = read(fixtures.degradedConfiguration);
  check(
    "degraded carries no upcoming/past",
    !("upcoming" in result) && !("past" in result),
    "supplying [] beside a failure state says 'I cannot answer' and 'here are your zero sales' in one breath, which is the same conflation one layer up"
  );
  check(
    "degraded carries a reason for code",
    typeof result.reason === "string" && result.reason.length > 0,
    "a degradation with no machine-readable reason cannot be logged or told apart from any other"
  );
  check(
    "degraded carries a non-empty message for the page",
    typeof result.message === "string" && result.message.trim().length > 0,
    "an empty message renders an empty box, which is a bare error wearing a friendly layout"
  );
  check(
    "the platform's own sentence is preferred over ours",
    result.message === fixtures.degradedConfiguration.body.message,
    "the server knows which degradation this is; discarding its sentence loses that"
  );
  check(
    "a degradation with no message still gets one",
    read(fixtures.bareServerError).message.trim().length > 0,
    "the fallback exists so an absent message cannot produce an empty notice"
  );
}

// --- THE RENDER DISTINCTION: hidden and unavailable must never be one --------
{
  const emptyFeed = read(fixtures.feedGenuinelyEmpty);
  const degradedFeed = read(fixtures.degradedConfiguration);

  check(
    "section: nothing scheduled renders hidden",
    sectionMode(emptyFeed, emptyFeed.upcoming) === "hidden",
    "a quiet week is a true answer and the section correctly leaves the page"
  );
  check(
    "section: degraded renders unavailable",
    sectionMode(degradedFeed, []) === "unavailable",
    "a degraded feed must not take the same exit as an empty one"
  );
  check(
    "section: hidden != unavailable",
    sectionMode(emptyFeed, emptyFeed.upcoming) !== sectionMode(degradedFeed, []),
    "THE COLLAPSE: if these are ever equal the visitor is told this business has nothing on when the truth is the list would not load"
  );

  check(
    "sale page: missing slug on a good feed is not-found",
    salePageMode(emptyFeed, undefined) === "not-found",
    "the feed answered and the slug is genuinely not in it"
  );
  check(
    "sale page: degraded is unavailable, never not-found",
    salePageMode(degradedFeed, undefined) === "unavailable",
    "'not found' is a claim about the world made from a failure to ask; a visitor holding a real link is told their sale does not exist"
  );
  check(
    "sale page: not-found != unavailable",
    salePageMode(emptyFeed, undefined) !== salePageMode(degradedFeed, undefined),
    "the sharpest instance of the collapse on this site"
  );
}

// --- a snapshot must never bake the notice into a static file ---------------
{
  const degradedFeed = read(fixtures.degradedConfiguration);
  const emptyFeed = read(fixtures.feedGenuinelyEmpty);

  check(
    "snapshot: degraded renders hidden, never the notice",
    sectionMode(degradedFeed, [], { snapshot: true }) === "hidden",
    "A BUILD MACHINE CANNOT REACH THE FEED, so every prerender gets a degraded answer. Writing the notice into dist/home/index.html freezes one moment's failure for every visitor until the next build — the cached-503 hazard the platform sends no-store to avoid, except baked. This gate exists because that regression was measured in dist, not reasoned about."
  );
  check(
    "snapshot: a live visitor still gets the notice",
    sectionMode(degradedFeed, [], { snapshot: false }) === "unavailable",
    "the snapshot exception must not leak into the browser, or the whole slice is undone"
  );
  check(
    "snapshot: a real list still renders",
    sectionMode(emptyFeed, [{ slug: "a" }], { snapshot: true }) === "list",
    "snapshotting sales that genuinely loaded is the entire point of prerendering"
  );
}

// --- calibration: the checker can distinguish, and can also FAIL -------------
{
  // Known-present: a state this file asserts about really is produced.
  check(
    "calibration (positive): FEED_OK is reachable",
    read(fixtures.feedWithSales).state === FEED_OK,
    "if this fails the fixtures or the reader moved and every other result here is meaningless"
  );
  // Known-absent: the reader does not answer with a state nobody defined.
  check(
    "calibration (negative): no third state appears",
    [FEED_OK, FEED_DEGRADED].includes(read(fixtures.okButUnreadable).state),
    "an unexpected state means the reader grew a branch this gate does not cover"
  );
}

process.stdout.write(
  failures
    ? `DEGRADED STATES: ${failures} failed of ${checks} checks over ${cases.length} response fixtures\n`
    : `DEGRADED STATES: ${checks} checks over ${cases.length} response fixtures, cannot-answer distinct from answer-is-none\n`
);
process.exitCode = failures ? 1 : 0;
