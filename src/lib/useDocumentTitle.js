import { useEffect } from "react";

/** What `index.html` ships, and what the home route restores. */
export const SITE_TITLE = "Cash 4 It Now — Veteran-Owned Estate Liquidators";

const SITE_NAME = "Cash 4 It Now";

/**
 * Sets document.title for a route.
 *
 * EVERY route must call this, the home page included. This is one document that
 * never reloads, so a route that sets no title keeps whatever the previous route
 * set: without the call on Home, walking About -> Home leaves the tab reading
 * "Our Story".
 *
 * Pass null for the site default. A page whose title depends on fetched data
 * calls this before its early returns — hooks cannot be conditional, and the
 * loading and not-found states need titles too.
 *
 * This runs in an effect, so the title lands after hydration and a crawler that
 * does not execute JS still sees index.html's one title. That is the SPA limit
 * (0.3) and it is not fixed here; a prerender pass that snapshots a real browser
 * would capture these, which is why they are worth setting now.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_TITLE;
  }, [title]);
}
