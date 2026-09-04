import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, CalendarClock } from "lucide-react";
import { salesQuery, saleGridClass } from "@/api/salesClient";
import { isDegraded, isSnapshot } from "@/api/salesWire";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import SaleCard from "@/components/sales/SaleCard";
import EmptyPanel from "@/components/ui/EmptyPanel";
import SalesUnavailableNotice from "@/components/sales/SalesUnavailableNotice";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, breadcrumbGraph, saleEventsGraph } from "@/lib/structuredData";

/**
 * Every estate sale we have catalogued, as its own page.
 *
 * THE PUBLIC END OF THE ADMIN TOOL'S CATALOGS. A catalog is built in the
 * platform, published, and appears here and on /sale/<slug> without anybody
 * touching this repo. The chain is /api/public/sales -> salesClient ->
 * SaleCard -> /sale/:slug, and the only reason it renders nothing today is that
 * nothing has been published yet.
 *
 * THE NAME. Ben asked for "Upcoming Orders". It ships as Upcoming Sales, and the
 * word is a constant below so changing it is one line. Three reasons, all of
 * which would otherwise have to be undone later: the platform endpoint, the
 * route /sale/:slug and every helper in salesClient say "sale"; the structured
 * data emits schema.org Event, for which an estate sale is the correct type and
 * an order is not; and the home page band already reads "Upcoming Sales" to the
 * same visitor. A visible label that disagrees with its own URL is worse than
 * either name alone.
 */
const PAGE_LABEL = "Upcoming Sales";

/**
 * WHY THIS PAGE ASKS isDegraded DIRECTLY AND DOES NOT USE sectionMode.
 *
 * sectionMode answers for a SECTION on a page about something else, where the
 * right response to an empty feed is to leave: a home page must not advertise an
 * empty shelf. A page whose entire subject is the list cannot leave — a blank
 * screen at a URL the nav links to reads as broken, not as "nothing scheduled".
 *
 * The first version of this file got that far and then routed sectionMode's
 * "hidden" to the stated empty state, WHICH SHIPPED A LIE. sectionMode returns
 * "hidden" for two different facts: the feed answered and the answer was none,
 * and we are prerendering and the feed was unreachable. Collapsing them is
 * correct for a section, because both mean "do not render me". It is wrong here,
 * because the two map to opposite sentences, and the crawl runs with no feed —
 * so every build baked "Nothing on the calendar yet" into a static file at a
 * moment when the honest answer was "we could not load them". That is exactly
 * the defect 8cc500a fixed for the home page, reintroduced one page over.
 *
 * So the question is asked in the one place it can be answered:
 *
 *   degraded + snapshot  -> "pending", which CLAIMS NOTHING. The static file
 *                           carries the placeholder and the client replaces it
 *                           with the truth on first paint.
 *   degraded + live      -> "unavailable", the honest notice.
 *   feed ok, no sales    -> "empty", a real fact and safe to bake.
 *   feed ok, sales       -> "list".
 */
function pageMode(result, sales) {
  if (isDegraded(result)) return isSnapshot() ? "pending" : "unavailable";
  return (Array.isArray(sales) ? sales : []).length === 0 ? "empty" : "list";
}

export default function UpcomingSales() {
  usePageMeta({
    title: `${PAGE_LABEL} and Estate Sale Catalogs`,
    description:
      "Estate sales coming up from Cash 4 It Now in Pittsburgh and Western Pennsylvania, with the catalog for each sale as soon as it is published.",
  });
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: PAGE_LABEL, path: "/upcoming-sales" },
    ])
  );

  const { data, isLoading } = useQuery(salesQuery());
  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];
  const mode = pageMode(data, upcoming);

  // Same @id as the copies on the home page and the sale page, so a consumer
  // reading all three sees one event described three times rather than three
  // events. Emitted before any early return: hooks cannot be conditional, and
  // saleEventsGraph returns null when there is nothing truthful to say.
  useJsonLd("sale-events", saleEventsGraph(upcoming));

  return (
    <div className="pt-16 bg-background min-h-screen">
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Cash 4 It Now</p>
            <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
              {PAGE_LABEL}
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-4" />
            <p className="text-background/70 text-lg max-w-xl">
              Every sale we have coming up, with the full catalog for each one as soon as it is photographed and
              priced.
            </p>
            <a
              href={CONTACT_PHONE_HREF}
              className="mt-6 inline-flex items-center gap-3 bg-accent text-white px-6 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-accent/90 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {CONTACT_PHONE}
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-10 bg-background">
        <div className="max-w-7xl mx-auto">
          {(isLoading || mode === "pending") && (
            /* Shaped like the grid it becomes, so the page does not jump when the
               feed lands. Three is the widest row; fewer sales simply fill less.
               Also the snapshot's resting state: it asserts nothing, which is the
               only safe thing to bake into a file served to everyone. */
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-2 border-foreground/15">
                  <div className="h-48 bg-foreground/5" />
                  <div className="p-6">
                    <div className="h-4 w-40 bg-foreground/10 mb-3" />
                    <div className="h-6 w-3/4 bg-foreground/10 mb-3" />
                    <div className="h-3 w-full bg-foreground/5 mb-1.5" />
                    <div className="h-3 w-5/6 bg-foreground/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && mode === "unavailable" && (
            <SalesUnavailableNotice message={data?.message} tone="light" />
          )}

          {!isLoading && mode === "empty" && (
            /* Nothing scheduled is a real, sayable fact, and it is NOT the same
               statement as the notice above. It must never borrow that wording. */
            <EmptyPanel
              icon={CalendarClock}
              eyebrow="Between Sales"
              title="Nothing on the calendar yet"
              actions={
                <>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-accent/90 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {CONTACT_PHONE}
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 border-2 border-foreground px-6 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors"
                  >
                    Tell Us What You Want
                  </Link>
                </>
              }
            >
              The next sale is not scheduled. Call and we will tell you what is coming, or leave your email in the
              footer and we will let you know the day it is posted.
            </EmptyPanel>
          )}

          {!isLoading && mode === "list" && (
            <div className={`grid gap-6 ${saleGridClass(upcoming.length)}`}>
              {upcoming.map((sale, i) => (
                <SaleCard key={sale.slug} sale={sale} index={i} tone="light" />
              ))}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="font-heading font-black text-background text-4xl md:text-6xl uppercase tracking-tight mb-2">
                Sales We Have Run
              </h2>
              <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
            </motion.div>

            {/* No coupon signup on a sale that has finished: it collects an email
                against an event nobody can attend. */}
            <div className={`grid gap-6 ${saleGridClass(past.length)}`}>
              {past.map((sale, i) => (
                <SaleCard key={sale.slug} sale={sale} index={i} tone="dark" showSignup={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
