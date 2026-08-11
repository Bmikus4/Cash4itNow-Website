import { useEffect } from "react";
import { CONTACT_PHONE } from "@/api/leadForm";
import { resolveOrigins } from "@/lib/origins";

const { site: SITE_ORIGIN } = resolveOrigins(import.meta.env);
const SITE_NAME = "Cash 4 It Now";

/**
 * Injects one JSON-LD graph and removes it again when the route changes.
 *
 * Removal is the part that matters: these scripts are appended to a document
 * that never reloads, so without cleanup a visitor who walks two pages ends up
 * serving both pages' structured data at once, and a crawler executing JS reads
 * a document claiming to be two things.
 *
 * NOTHING HERE MAY EMIT Review OR AggregateRating. The homepage testimonials are
 * hardcoded strings; publishing them as ratings tells Google they are collected
 * reviews from real, attributable people, which is a claim about the truth made
 * to a third party rather than a formatting choice. That claim is Ben's to make
 * and nobody else's. Do not add it, and do not leave it here commented out
 * waiting to be switched on.
 */
export function useJsonLd(id, data) {
  const json = data ? JSON.stringify(data) : "";
  useEffect(() => {
    if (!json) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.jsonld = id;
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [id, json]);
}

/**
 * The business itself. No `address` on purpose: the site has no street address
 * to give, the contract withholds sale addresses, and LocalBusiness is valid
 * without a PostalAddress. An invented or approximate one would be worse than
 * none, since this is the record other tools read as authoritative.
 */
export function localBusinessGraph() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_ORIGIN}/#business`,
    name: `${SITE_NAME} Estate Liquidators`,
    description:
      "Veteran-owned estate liquidation, full estate cleanouts, and cash purchases of antiques and collectibles.",
    url: `${SITE_ORIGIN}/`,
    telephone: CONTACT_PHONE,
    areaServed: [
      { "@type": "City", name: "Pittsburgh", containedInPlace: { "@type": "State", name: "Pennsylvania" } },
      { "@type": "AdministrativeArea", name: "Western Pennsylvania" },
    ],
    knowsAbout: ["Estate liquidation", "Estate cleanouts", "Antiques", "Collectibles", "Estate jewelry"],
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Veteran-owned",
      value: true,
    },
  };
}

export function webSiteGraph() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    publisher: { "@id": `${SITE_ORIGIN}/#business` },
  };
}

/** `trail` is [{ name, path }] from the home page inward, home included. */
export function breadcrumbGraph(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_ORIGIN}${crumb.path}`,
    })),
  };
}

/**
 * What we buy, as an offer catalog. Built from the same hardcoded array the
 * Categories page renders, passed in rather than imported, so there is one copy
 * of the list and no import cycle.
 */
export function offerCatalogGraph(categories, extraItems = []) {
  const names = [...categories.flatMap((category) => category.items ?? []), ...extraItems];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Estate item purchasing",
    serviceType: "Estate liquidation and item purchasing",
    provider: { "@id": `${SITE_ORIGIN}/#business` },
    areaServed: { "@type": "AdministrativeArea", name: "Western Pennsylvania" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "What we buy",
      itemListElement: categories.map((category) => ({
        "@type": "OfferCatalog",
        name: category.title,
        itemListElement: (category.items ?? []).map((item) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Product", name: item },
        })),
      })),
    },
    // Flat list too: the nested catalog is the accurate shape, and this is what a
    // consumer that does not walk nested catalogs will still read.
    keywords: names.join(", "),
  };
}
