import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Images, Phone } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import KineticGrid from "@/components/ui/kinetic-grid";
import { salesQuery, saleDateRange, saleLocation } from "@/api/salesClient";
import { isDegraded, isSnapshot } from "@/api/salesWire";
import { readCatalog, CATALOG_ITEMS, CATALOG_PENDING } from "@/api/catalogChannel";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";

/**
 * The newest catalog, as the first thing on the site.
 *
 * WHY monochrome AND NOT THE COMPONENT'S DEFAULT. KineticGrid ships two themes.
 * Its "default" paints the active grid lines, node glow and ripples in
 * rgb(74,158,255) — the exact AI blue this site has no place for. One accent is
 * the hardest rule the design has (docs/UI-PRINCIPLES.md §8), and a blue that
 * only appears under the cursor is still a second hue. "monochrome" is white on
 * black, which is neutral texture rather than a colour, and leaves the red type
 * on top as the only thing in the frame with a hue.
 *
 * Its black is #000000 where the site's ink is hsl(0 0% 5%). That is a knowing
 * deviation and the only one: it is a canvas texture behind content, not a
 * surface anything is measured against, and the section below it opens on the
 * real ink so the seam is never visible in one view.
 *
 * NO SEPARATE REQUEST. This shares SALES_QUERY_KEY with UpcomingSalesSection, so
 * react-query serves both from one fetch. Adding a second query key here would
 * have the home page ask the platform for the same list twice.
 */

/**
 * The newest catalog is the SOONEST upcoming sale, not the first element.
 *
 * The feed's order is the platform's business and has never been part of the
 * contract, so relying on it would make this section's headline depend on an
 * implementation detail one repo over. Sorting by the field that actually means
 * "next" costs nothing and cannot drift. Sales with no parseable date sort last
 * rather than being dropped: a sale with a missing date is still a real sale,
 * and it is the sale page's job to say what it knows.
 */
function newestCatalog(upcoming) {
  const list = Array.isArray(upcoming) ? upcoming.filter(Boolean) : [];
  if (!list.length) return null;
  const time = (sale) => {
    const t = sale?.startsAt ? new Date(sale.startsAt).getTime() : NaN;
    return Number.isNaN(t) ? Infinity : t;
  };
  return [...list].sort((a, b) => time(a) - time(b))[0];
}

function catalogCount(catalog) {
  const read = readCatalog(catalog);
  const counted = read.state === CATALOG_ITEMS || read.state === CATALOG_PENDING;
  if (!counted || !Number.isFinite(read.count) || read.count <= 0) return null;
  return read.count;
}

export default function NewestCatalogSection() {
  const reduceMotion = useReducedMotion();
  const { data, isLoading } = useQuery(salesQuery());
  const upcoming = data?.upcoming ?? [];

  /*
   * A DEGRADED FEED MUST NOT BECOME "NO SALES" HERE EITHER, and on this section
   * that pressure is strongest, because it sits above the fold and the tempting
   * fallback is the confident brand statement. So the sale is shown only when a
   * feed that ANSWERED gave us one. Degraded and snapshot both fall through to
   * the standing panel below, which makes no claim about the calendar at all —
   * it says what the business is, which is true whatever the feed did.
   */
  const trustworthy = !isLoading && !isDegraded(data) && !isSnapshot();
  const sale = trustworthy ? newestCatalog(upcoming) : null;
  const count = sale ? catalogCount(sale.catalog) : null;
  const dates = sale ? saleDateRange(sale, format) : "";
  const where = sale ? saleLocation(sale) : "";

  const rise = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  return (
    <KineticGrid globalColor="monochrome" className="min-h-[100dvh]">
      <div className="min-h-[100dvh] flex items-center px-6 md:px-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto w-full">
          {sale ? (
            <div className="max-w-3xl">
              <motion.p
                {...rise}
                transition={{ delay: 0.1 }}
                className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-4"
              >
                Newest Catalog
              </motion.p>

              <motion.h2
                {...rise}
                transition={{ delay: 0.2 }}
                className="font-heading font-black text-white text-4xl md:text-6xl lg:text-7xl uppercase leading-[0.95] tracking-tight mb-5"
              >
                {sale.title}
              </motion.h2>

              <motion.div {...rise} transition={{ delay: 0.3 }} className="h-1.5 bg-accent w-24 mb-6" />

              <motion.div
                {...rise}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6"
              >
                {dates && (
                  <span className="inline-flex items-center gap-2 font-heading text-accent text-sm uppercase tracking-wider font-bold">
                    <Calendar className="w-4 h-4" />
                    {dates}
                  </span>
                )}
                {where && (
                  <span className="inline-flex items-center gap-2 font-heading text-white/70 text-sm uppercase tracking-wider font-bold">
                    <MapPin className="w-4 h-4 text-white/40" />
                    {where}
                  </span>
                )}
                {count && (
                  <span className="inline-flex items-center gap-2 font-heading text-white/70 text-sm uppercase tracking-wider font-bold">
                    <Images className="w-4 h-4 text-white/40" />
                    {count} {count === 1 ? "item" : "items"} catalogued
                  </span>
                )}
              </motion.div>

              {sale.description && (
                <motion.p
                  {...rise}
                  transition={{ delay: 0.4 }}
                  className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-xl line-clamp-3"
                >
                  {sale.description}
                </motion.p>
              )}

              <motion.div {...rise} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/sale/${sale.slug}`}
                  className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 font-heading font-black text-lg md:text-xl uppercase tracking-wider hover:bg-accent/90 transition-colors"
                >
                  View The Catalog
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/upcoming-sales"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:border-accent hover:text-accent transition-colors"
                >
                  Every Upcoming Sale
                </Link>
              </motion.div>
            </div>
          ) : (
            /*
             * THE STANDING PANEL. Reached while loading, while prerendering, when
             * the feed is degraded, and when there is genuinely nothing on. It
             * deliberately says nothing about the calendar in any of those cases,
             * because only one of them knows anything about the calendar — and
             * this is a static file for two of them. What it says instead is what
             * the business is, which no feed can contradict.
             */
            <div className="max-w-3xl">
              <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-4">
                Veteran-Owned Estate Liquidators
              </p>
              <h2 className="font-heading font-black text-white text-4xl md:text-6xl lg:text-7xl uppercase leading-[0.95] tracking-tight mb-5">
                Every Catalog,
                <br />
                As Soon As It Is Priced
              </h2>
              <div className="h-1.5 bg-accent w-24 mb-6" />
              <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
                We photograph and price every estate we take on, and the full catalog goes up here before the doors
                open.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/upcoming-sales"
                  className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 font-heading font-black text-lg md:text-xl uppercase tracking-wider hover:bg-accent/90 transition-colors"
                >
                  See Upcoming Sales
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={CONTACT_PHONE_HREF}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:border-accent hover:text-accent transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </KineticGrid>
  );
}
