import { useEffect } from "react";
import { CONTACT_PHONE } from "@/api/leadForm";
import { resolveOrigins } from "@/lib/origins";
import { saleEventGraph as buildSaleEvent, saleEventsGraph as buildSaleEvents } from "@/lib/eventGraph";

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
 * THE TESTIMONIALS MUST NEVER BECOME MACHINE-READABLE, IN ANY FORM. Not Review,
 * not AggregateRating, not a bare `author` or `reviewer`, and not as microdata or
 * RDFa attributes on the page either. This is settled permanently, not deferred:
 * asked directly, Ben confirmed the quotes are not real and are copy only.
 * Publishing them as data would state to a third party that they are collected
 * reviews from real people, which would be false. Do not add it, and do not
 * leave it commented out waiting to be switched on.
 *
 * Separately and equally binding: that page copy is not ours to edit, remove,
 * soften or annotate. The scope here is only that it never leaves the site as
 * data.
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

/**
 * One answer page, per §8.3's "Article on every post".
 *
 * `author` is the business, by reference to the LocalBusiness graph — NOT a
 * person. Naming a writer we have not confirmed exists would be the same defect
 * as the testimonials: a claim about a real human made to a machine that treats
 * it as fact. An organisation as author is both true and a shape consumers
 * accept, so there is nothing to gain by inventing a byline.
 *
 * Dates come from the post's own written-down `published`/`updated` fields
 * rather than from a clock, so two builds of one commit emit identical bytes.
 */
export function articleGraph(post, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.question,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: "en-US",
    author: { "@id": `${SITE_ORIGIN}/#business` },
    publisher: { "@id": `${SITE_ORIGIN}/#business` },
    about: { "@type": "Thing", name: "Estate liquidation" },
    isPartOf: { "@type": "Blog", "@id": `${SITE_ORIGIN}/blog#blog`, name: `${SITE_NAME} — Answers` },
  };
}

/** The index, as a Blog whose posts are listed in the order the page shows them. */
export function blogGraph(posts, pathFor) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_ORIGIN}/blog#blog`,
    name: `${SITE_NAME} — Answers`,
    description: "Straight answers to what executors, families and realtors ask before an estate is cleared.",
    url: `${SITE_ORIGIN}/blog`,
    publisher: { "@id": `${SITE_ORIGIN}/#business` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.question,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated,
      url: `${SITE_ORIGIN}${pathFor(post)}`,
      author: { "@id": `${SITE_ORIGIN}/#business` },
    })),
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

/** Thin wrappers supplying the canonical origin; the logic is in eventGraph.js. */
export function saleEventGraph(sale, origin = SITE_ORIGIN) {
  return buildSaleEvent(sale, origin);
}

export function saleEventsGraph(sales, origin = SITE_ORIGIN) {
  return buildSaleEvents(sales, origin);
}
