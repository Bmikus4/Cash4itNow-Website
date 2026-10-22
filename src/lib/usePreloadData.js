import { useEffect } from "react";

/**
 * Puts `<link rel="preload" as="fetch">` for a page's data into <head>, so the
 * browser asks for it while parsing the HTML instead of after the bundle has
 * downloaded and booted.
 *
 * It works through the prerender, not at runtime: scripts/prerender.mjs
 * snapshots <head> after the page has run, so the link is in the static HTML
 * of every prerendered page that calls this. At runtime the link is already
 * there and this does nothing.
 *
 * The preload is used only if it matches the fetch exactly. The clients fetch
 * cross-origin with default credentials, which is what crossorigin="anonymous"
 * asks for. Give the fetch credentials or a different URL and the browser
 * downloads the data twice.
 */
export function usePreloadData(url) {
  useEffect(() => {
    if (!url) return;
    const present = Array.from(document.head.querySelectorAll('link[rel="preload"][as="fetch"]')).some((l) => l.getAttribute("href") === url);
    if (present) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "fetch";
    link.href = url;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, [url]);
}
