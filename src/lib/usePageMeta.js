import { useEffect } from "react";
import { resolveOrigins } from "@/lib/origins";

/** What `index.html` ships, and what the home route restores. */
export const SITE_TITLE = "Cash 4 It Now — Veteran-Owned Estate Liquidators";
export const SITE_DESCRIPTION =
  "Cash 4 It Now — veteran-owned estate liquidation and full estate cleanout services in Pittsburgh, PA.";

const SITE_NAME = "Cash 4 It Now";

/**
 * `og:url` and `og:image` are the only meta here that cannot be relative — a
 * scraper fetches them from its own servers, with no page to resolve against.
 * The origin comes from src/lib/origins.js, which is the single place any origin
 * is written down; there is deliberately no second constant here.
 *
 * SHARE_IMAGE is the one remaining gap, and it is an asset gap rather than a
 * decision: **there is no share image in this repo.** `public/` holds a favicon
 * and the two hero photos, nothing purpose-made near the 1200x630 a scraper
 * wants. So og:image is omitted, because a wrong absolute URL is worse than a
 * missing tag — a scraper caches what it fetched and the broken preview outlives
 * the fix. Drop an image in `public/`, name its path here, and `twitter:card`
 * upgrades itself below: "summary" is only correct while there is no image.
 */
export const SITE_ORIGIN = resolveOrigins(import.meta.env).site;
export const SHARE_IMAGE = "";

/**
 * Creates, updates or removes one meta tag. `og:*` is addressed by `property`
 * and `twitter:*`/`name` meta by `name`; passing an empty content removes the
 * tag rather than emitting an empty one.
 */
function upsertMeta(attr, key, content) {
  const existing = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    if (existing) existing.remove();
    return;
  }
  const tag = existing || document.head.appendChild(document.createElement("meta"));
  tag.setAttribute(attr, key);
  tag.setAttribute("content", content);
}

/**
 * Sets the title, description, Open Graph and Twitter meta for a route.
 *
 * EVERY route must call this, the home page included. This is one document that
 * never reloads, so a route that sets nothing keeps whatever the previous route
 * set: without the call on Home, walking About -> Home leaves the tab reading
 * "Our Story" and every share of the homepage describing the About page.
 *
 * Omit a field for the site default. A page whose text depends on fetched data
 * calls this before its early returns — hooks cannot be conditional, and the
 * loading and not-found states need meta too.
 *
 * `robots` is removed on any route that does not ask for it. That is not tidying:
 * the tag would otherwise survive a client-side navigation off /favorites and
 * quietly noindex every page the visitor walked to next.
 *
 * All of this runs in an effect, so it lands after hydration and a crawler that
 * does not execute JS sees only the static set in index.html. That is the SPA
 * limit (0.3); a prerender pass that snapshots a real browser captures these,
 * which is why they are worth setting now.
 */
export function usePageMeta({ title, description, robots } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_TITLE;
    const summary = description || SITE_DESCRIPTION;

    document.title = fullTitle;
    upsertMeta("name", "description", summary);

    // Twitter reads og:title and og:description when its own are absent, so
    // they are not duplicated here.
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", summary);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", SITE_ORIGIN && SHARE_IMAGE ? "summary_large_image" : "summary");

    upsertMeta("property", "og:url", SITE_ORIGIN ? `${SITE_ORIGIN}${window.location.pathname}` : "");
    upsertMeta("property", "og:image", SITE_ORIGIN && SHARE_IMAGE ? `${SITE_ORIGIN}${SHARE_IMAGE}` : "");

    upsertMeta("name", "robots", robots);
  }, [title, description, robots]);
}
