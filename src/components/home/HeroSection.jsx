import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, ArrowDown, ChevronRight, ArrowRight, Calendar, Images } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import HeroLeadForm from "@/components/home/HeroLeadForm";
import KineticGrid from "@/components/ui/kinetic-grid";
import { salesQuery, saleDateRange, saleLocation } from "@/api/salesClient";
import { isDegraded, isSnapshot } from "@/api/salesWire";
import { readCatalog, CATALOG_ITEMS, CATALOG_PENDING } from "@/api/catalogChannel";

/**
 * ONE HERO, on the kinetic grid.
 *
 * This was briefly two stacked full-viewport sections — a kinetic-grid panel with
 * its own headline, then the hero underneath with its own — and Ben's read was
 * that it was not what he asked for. It wasn't: the site opened by saying two
 * different things in two screens before a visitor reached anything. The grid is
 * the hero's background now and the hero's own copy sits on it, which is what
 * "this should overlay the kinetic grid" means.
 *
 * The before/after slider that used to live here is gone for good (Ben, "remove
 * the hero image from the website"), and so is the marquee that briefly replaced
 * it — that component is now its own band below, in InventoryMarquee.
 *
 * BeforeAfterSlider.jsx STAYS: /for-professionals renders its own before/after
 * with it, so deleting it to tidy up would break that page.
 *
 * NO "SEE UPCOMING SALES" BUTTON HERE, on Ben's call: it belongs at the bottom of
 * How It Works and at the bottom of the page, where somebody has read enough to
 * want it. The hero keeps the two actions it has always converted on, the phone
 * number and a free evaluation, plus the anchor down to How It Works.
 *
 * WHEN A CATALOG IS PUBLISHED it appears here as a strip under the buttons rather
 * than as a competing headline. That keeps the promise the grid section was added
 * for without giving the newest sale a louder voice than the business's own name.
 */

/** As in SaleCard: only ITEMS and a counted PENDING carry a number the feed stated. */
function catalogCount(catalog) {
  const read = readCatalog(catalog);
  const counted = read.state === CATALOG_ITEMS || read.state === CATALOG_PENDING;
  if (!counted || !Number.isFinite(read.count) || read.count <= 0) return null;
  return read.count;
}

/**
 * The soonest sale by startsAt, not upcoming[0]. Feed order is the platform's
 * business and has never been part of the contract, so a headline that depended
 * on it would depend on an implementation detail one repo over.
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

export default function HeroSection() {
  const [showForm, setShowForm] = useState(false);
  const reduceMotion = useReducedMotion();

  // Shares SALES_QUERY_KEY with UpcomingSalesSection, so the home page asks the
  // platform for this list once rather than twice.
  const { data, isLoading } = useQuery(salesQuery());

  /*
   * The strip renders only when a feed that ANSWERED gave us a sale. Degraded and
   * snapshot both fall through to nothing, because this is above the fold and two
   * of those states are a static file — the same rule as /upcoming-sales, for the
   * same reason. An absent strip claims nothing; a present one is always true.
   */
  const trustworthy = !isLoading && !isDegraded(data) && !isSnapshot();
  const sale = trustworthy ? newestCatalog(data?.upcoming) : null;
  const count = sale ? catalogCount(sale.catalog) : null;
  const dates = sale ? saleDateRange(sale, format) : "";
  const where = sale ? saleLocation(sale) : "";

  const rise = (delay) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  return (
    <KineticGrid globalColor="monochrome" className="min-h-[100dvh]">
      <div className="min-h-[100dvh] flex items-center px-6 md:px-10 pt-24 pb-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl">
            <motion.div
              {...rise(0.1)}
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 mb-8"
            >
              <span className="text-sm font-bold uppercase tracking-widest font-heading">Veteran-Owned Business</span>
            </motion.div>

            <motion.h1
              {...rise(0.2)}
              className="font-heading font-black text-white text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-tight mb-4"
            >
              Cash 4 It Now
            </motion.h1>

            <motion.h2
              {...rise(0.3)}
              className="font-heading font-bold text-accent text-2xl md:text-3xl uppercase tracking-wide mb-5"
            >
              Estate Liquidators
            </motion.h2>

            <motion.div {...rise(0.35)} className="w-full max-w-xl h-1 bg-accent mb-6" />

            <motion.p
              {...rise(0.4)}
              className="text-white/80 text-base md:text-lg leading-relaxed mb-10 max-w-lg"
            >
              A complete estate service from evaluating the assets, conducting the sale, to getting the home and
              property ready for sale.
            </motion.p>

            <motion.div {...rise(0.5)} className="flex flex-col sm:flex-row flex-wrap gap-4">
              <a
                href="tel:4129697757"
                className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 font-heading font-black text-xl md:text-2xl uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-6 h-6" />
                412-969-7757
              </a>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-white/10 transition-colors"
                >
                  Free Evaluation
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              {/* Smooth by CSS, not by a handler here. See the html rule in
                  src/index.css and the scroll-margin that clears the fixed nav. */}
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
              >
                How We Get It Done
                <ArrowDown className="w-5 h-5" />
              </a>
            </motion.div>

            {showForm && (
              <div className="mt-6 max-w-lg">
                <HeroLeadForm />
              </div>
            )}

            {sale && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="mt-10 border-2 border-white/25 bg-white/[0.04] p-5 md:p-6 max-w-xl"
              >
                <p className="font-heading text-accent text-xs uppercase tracking-[0.3em] mb-2">Newest Catalog</p>
                <h3 className="font-heading font-black text-white text-xl md:text-2xl uppercase tracking-tight leading-tight mb-3">
                  {sale.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-4">
                  {dates && (
                    <span className="inline-flex items-center gap-2 font-heading text-accent text-xs uppercase tracking-wider font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      {dates}
                    </span>
                  )}
                  {where && (
                    <span className="font-heading text-white/60 text-xs uppercase tracking-wider font-bold">{where}</span>
                  )}
                  {count && (
                    <span className="inline-flex items-center gap-2 font-heading text-white/60 text-xs uppercase tracking-wider font-bold">
                      <Images className="w-3.5 h-3.5" />
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
                <Link
                  to={`/sale/${sale.slug}`}
                  className="inline-flex items-center gap-2 font-heading font-black text-xs uppercase tracking-widest text-accent hover:text-white transition-colors"
                >
                  View The Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* data-loop-animation: this never settles, so framer-motion rewrites its
          inline transform every frame and a snapshot captures whichever value the
          capture happened to land on. The prerender crawl strips the style
          attribute of anything carrying this, which is what makes two builds of
          one commit byte-identical. The grid canvas does NOT need it: a canvas
          paints pixels and never writes to the inline style the snapshot reads. */}
      <motion.div
        data-loop-animation
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="w-6 h-6 text-white/40" />
      </motion.div>
    </KineticGrid>
  );
}
