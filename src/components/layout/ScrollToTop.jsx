import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A new page starts at the top of itself.
 *
 * WHAT WAS BROKEN. A browser resets the scroll position when it loads a
 * document; a single-page app never loads a second document, so it doesn't.
 * React Router changes the markup under a scroll position that belongs to the
 * page you just left, and nothing puts it back. Click Our Story from halfway
 * down the home page and you land halfway down Our Story — past the headline,
 * mid-sentence, with no way to tell that is what happened. Ben: "when pressing a
 * button in the nav bar at the top of the screen, the user should always land at
 * the top of the page".
 *
 * A HASH IS LEFT ALONE. `/#services` and any future in-page anchor are a request
 * for a specific place on the page, and scrolling to the top would be
 * overriding the very instruction the URL carries.
 *
 * INSTANT, NOT SMOOTH, and that is the whole reason this calls scrollTo with an
 * options object rather than the two-argument form. src/index.css sets
 * `html { scroll-behavior: smooth }` so the in-page anchors glide; inherit that
 * here and every navigation animates a scroll through a page the visitor has
 * already left, which reads as the browser lagging. `behavior: "instant"` opts
 * this one call out of the CSS rule.
 *
 * IT RUNS ON PATHNAME, NOT ON `location`. The location object is a new
 * identity on every render in some Router versions, and a search-parameter
 * change — a filter on /shop, say — is not a new page and must not throw the
 * reader back to the top of a list they were partway down.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      // Older browsers reject an unknown behavior value rather than ignoring it.
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
