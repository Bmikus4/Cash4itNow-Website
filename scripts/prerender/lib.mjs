/**
 * Pure half of the prerender crawl. No filesystem, no browser, no network — so
 * the decisions can be reasoned about and tested without a database, which is
 * the whole of what is provable on this build today.
 */

/**
 * The route list has ONE source: src/App.jsx. vercel.json's rewrites and this
 * crawl both derive from it, and the build gate asserts they agree. A literal
 * route list in a third file is how they drift.
 *
 * "/" is a real file and needs no rewrite; "*" is the in-app 404, reached through
 * the terminal catch-all rather than by a route of its own.
 */
export function routesFromApp(appSource) {
  const all = [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
  return {
    static: all.filter((route) => route !== "*" && !route.includes(":")),
    dynamic: all.filter((route) => route.includes(":")),
  };
}

/**
 * "/about" -> "about/index.html"; "/" -> "home/index.html".
 *
 * The home snapshot must NOT be written over dist/index.html. That file is the
 * fallback every un-snapshotted route rewrites to, so overwriting it would serve
 * the homepage's markup — its title, and its LocalBusiness and WebSite JSON-LD —
 * statically on sale pages. That is not a missing tag, it is a wrong one: a
 * static claim contradicting the page it is served on. dist/index.html stays the
 * clean shell.
 */
export function outputPathFor(route) {
  return route === "/" ? "home/index.html" : `${route.replace(/^\//, "")}/index.html`;
}

/**
 * A rewrite must point AT the snapshot rather than relying on real files beating
 * rewrites. Whether Vercel checks the filesystem before applying a rewrite is
 * documented as yes but could not be confirmed for the neighbouring 404.html
 * case, and guessing at that ordering is what the CSP defect was. Naming the
 * file removes the question: there is nothing left to win.
 *
 * A route with no snapshot — because the feed was down, or it was skipped —
 * keeps /index.html and stays client-rendered. That is the degradation path, and
 * it is why this returns a rewrite for every route either way.
 */
export function rewritesFor(routes, snapshotted) {
  const taken = new Set(snapshotted);
  return routes.map((route) => ({
    source: route,
    destination: taken.has(route) ? `/${outputPathFor(route)}` : "/index.html",
  }));
}

/**
 * framer-motion starts every below-the-fold section at opacity:0 and reveals it
 * with whileInView. A snapshot taken without scrolling captures markup that says
 * invisible, and a crawler reads a page of hidden content. The crawl scrolls, and
 * this is the assertion that it worked — checked on the captured HTML rather than
 * trusted.
 */
export function countHiddenSections(html) {
  // INLINE style attributes only. A bare /opacity:\s*0/ also matches stylesheet
  // rules — sonner's injected toast CSS alone contributes 28 of them — which made
  // the first version of this warn on every page while the scroll was working.
  return (html.match(/style="[^"]*opacity:\s*0(?![.\d])[^"]*"/g) || []).length;
}

/**
 * Countdown digits are the reason two builds of one commit would otherwise never
 * match: the sale cards render live days/hours/minutes/seconds, so bytes differ
 * by the second. They are emptied rather than frozen at a value — a stale
 * countdown baked into a static file is a wrong fact served to a person, while an
 * empty one is filled in by the client on first paint.
 *
 * The element is found by its data attribute, which exists for exactly this
 * reason and for no styling purpose.
 */
export function stripNondeterminism(html) {
  return (
    html
      .replace(/(<span[^>]*data-countdown-value[^>]*>)[^<]*(<\/span>)/g, "$1$2")
      // Infinite framer-motion animations never settle, so their inline transform
      // is whatever the capture instant caught. Dropping the style attribute is
      // safe: the animation reapplies it on mount, and the element is decorative.
      .replace(/(<div[^>]*data-loop-animation[^>]*?)\s*style="[^"]*"/g, "$1")
  );
}

/** What the build log must say when a route is not snapshotted, and why. */
export function skipLine(route, reason) {
  return `  SKIPPED ${route} — ${reason}. It stays client-rendered; crawlers see the site default.`;
}
