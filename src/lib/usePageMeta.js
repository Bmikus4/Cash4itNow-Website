import { useEffect } from "react";

/** What `index.html` ships, and what the home route restores. */
export const SITE_TITLE = "Cash 4 It Now — Veteran-Owned Estate Liquidators";
export const SITE_DESCRIPTION =
  "Cash 4 It Now — veteran-owned estate liquidation and full estate cleanout services in Pittsburgh, PA.";

const SITE_NAME = "Cash 4 It Now";

function setDescription(content) {
  let tag = document.head.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Sets the title and meta description for a route.
 *
 * EVERY route must call this, the home page included. This is one document that
 * never reloads, so a route that sets nothing keeps whatever the previous route
 * set: without the call on Home, walking About -> Home leaves the tab reading
 * "Our Story" and the description describing the About page.
 *
 * Pass null for either to get the site default. A page whose text depends on
 * fetched data calls this before its early returns — hooks cannot be
 * conditional, and the loading and not-found states need meta too.
 *
 * This runs in an effect, so both land after hydration and a crawler that does
 * not execute JS still sees index.html's single title and description. That is
 * the SPA limit (0.3) and it is not fixed here; a prerender pass that snapshots
 * a real browser would capture these, which is why they are worth setting now.
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_TITLE;
    setDescription(description || SITE_DESCRIPTION);
  }, [title, description]);
}
