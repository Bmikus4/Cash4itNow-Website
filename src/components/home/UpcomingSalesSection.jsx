import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { salesQuery, saleGridClass } from "@/api/salesClient";
import { sectionMode, isSnapshot } from "@/api/salesWire";
import SaleCard from "@/components/sales/SaleCard";
import SalesUnavailableNotice from "@/components/sales/SalesUnavailableNotice";
import { useJsonLd, saleEventsGraph } from "@/lib/structuredData";

export default function UpcomingSalesSection() {
  const { data, isLoading } = useQuery(salesQuery());
  const sales = data?.upcoming ?? [];
  const mode = sectionMode(data, sales, { snapshot: isSnapshot() });

  // Emitted HERE and not on the sale page alone, and the reason is the prerender
  // boundary rather than taste: /sale/:slug is deliberately not snapshotted until
  // Phase 1, so an Event graph living only there would be invisible to every
  // crawler that does not run JS — which is the entire audience §8.3 wants it
  // for. The home page IS snapshotted and genuinely lists these sales, so the
  // structured data describes content that is really on the page.
  //
  // Both copies carry the same @id, so a consumer reading the home page and the
  // sale page sees ONE event described twice, not two events.
  //
  // Before the early return: hooks cannot be conditional. saleEventsGraph
  // returns null when there is nothing to say, and useJsonLd then emits no
  // script — an empty array would claim there are no upcoming sales, which is a
  // different statement from having no data yet.
  useJsonLd("sale-events", saleEventsGraph(sales));

  if (isLoading) return null;

  // Nothing scheduled is not a failure state: the section leaves the page
  // rather than advertising an empty shelf.
  //
  // A feed we could not READ is a different fact and must not take the same
  // exit. Vanishing here would tell a customer this business has nothing on,
  // which is precisely the lie the platform's 503 was added to stop telling.
  //
  // THE PAGE AT /upcoming-sales DOES NOT SHARE THIS EXIT, deliberately. A
  // section on a page about something else may leave; a page whose whole subject
  // is the list cannot, so it states the empty case instead. See pageMode() in
  // src/pages/UpcomingSales.jsx.
  if (mode === "hidden") return null;

  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Don't Miss Out</p>
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-background mb-2">
            Upcoming Sales
          </h2>
          <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
        </motion.div>

        {mode === "unavailable" ? (
          <SalesUnavailableNotice message={data?.message} />
        ) : (
          <>
            {/* The card is shared with /upcoming-sales rather than written twice.
                Two hand-kept copies of one card is the same defect shape as a
                hand-kept sitemap or a second origin literal. */}
            <div className={`grid gap-6 ${saleGridClass(sales.length)}`}>
              {sales.map((sale, i) => (
                <SaleCard key={sale.slug} sale={sale} index={i} tone="dark" />
              ))}
            </div>

            {/* This band shows what is next; the page shows everything, including
                the sales already run. Only reachable when there IS a list above
                it — the empty and degraded paths have already returned. */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/upcoming-sales"
                className="inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
              >
                See Every Sale
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
