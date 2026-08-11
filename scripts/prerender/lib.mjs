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
export function routesFromApp(appSource, expansions = {}) {
  const all = [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
  const named = all.filter((route) => route !== "*");
  return {
    static: named.flatMap((route) =>
      route.includes(":") ? expansions[route] ?? [] : [route]
    ),
    dynamic: named.filter((route) => route.includes(":") && !expansions[route]),
  };
}

/**
 * `/blog/:slug` is a parameterised route whose complete slug list is known at
 * build time, because it comes from src/content/posts.js rather than from a
 * feed. Expanding it here is what lets the posts be gated, rewritten,
 * prerendered and listed in the sitemap exactly like a hand-written route,
 * without a second list of posts existing anywhere.
 *
 * `/sale/:slug` is deliberately NOT expandable: its slugs come from the sales
 * API, which needs a database, so it stays dynamic and the crawl skips it.
 * That is the difference this function encodes — known at build time versus
 * known only at runtime.
 */
export function postExpansions(posts) {
  return { "/blog/:slug": posts.map((post) => `/blog/${post.slug}`) };
}

/**
 * Routes that must stay out of the sitemap, read from the page components
 * themselves rather than from a list kept alongside them.
 *
 * A hand-kept list of noindex routes is the same one-thing-two-representations
 * defect as a hand-kept sitemap: /favorites would keep its noindex meta while
 * quietly reappearing in the sitemap, which asks every crawler to fetch a URL we
 * then tell it to drop. Following App.jsx's own element -> import -> file chain
 * means the declaration in the component is the only declaration.
 *
 * `readSource` takes an import specifier as written in App.jsx and returns the
 * file's text, or null. Injected so this stays pure and testable.
 *
 * DELIBERATELY COARSE: it asks whether a component mentions a noindex robots
 * value anywhere, not whether the branch that renders for a given URL does. So
 * `/blog/:slug` reads as noindex because BlogPost noindexes its unknown-slug
 * branch. That costs nothing today — the sitemap lists the EXPANDED
 * `/blog/<slug>` routes, which are different strings — and erring toward
 * excluding is the safe direction: a page wrongly left out of a sitemap is still
 * crawled through the site's own links, while a page wrongly listed is a URL we
 * asked Google to fetch and then told it to drop.
 */
export function noindexRoutes(appSource, readSource) {
  const imports = new Map(
    [...appSource.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g)].map((m) => [m[1], m[2]])
  );
  const noindex = [];
  for (const [, route, component] of appSource.matchAll(/path="([^"]+)"\s+element=\{<(\w+)/g)) {
    const source = imports.has(component) ? readSource(imports.get(component)) : null;
    if (source && /robots:\s*["'][^"']*noindex/.test(source)) noindex.push(route);
  }
  return noindex;
}

/**
 * The sitemap, generated from the same expanded route list the gate and the
 * crawl use. Nothing here is hand-maintained.
 *
 * No `lastmod`: it would have to come from either a build clock — which breaks
 * the byte-identical guarantee the crawl was fixed to hold — or a per-route date
 * that only the posts have. An absent lastmod is valid and cannot be wrong,
 * which is worth more than a field crawlers treat as a hint.
 */
export function sitemapXml(origin, routes) {
  const urls = [...routes]
    .sort()
    .map((route) => `  <url><loc>${origin}${route === "/" ? "/" : route}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
