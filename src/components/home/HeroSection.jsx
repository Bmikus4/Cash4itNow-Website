import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, ArrowDown, ChevronRight, ArrowRight, Calendar, Images } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import HeroLeadForm from "@/components/home/HeroLeadForm";
import HeroCardRibbon from "@/components/home/HeroCardRibbon";
import KineticGrid from "@/components/ui/kinetic-grid";
import { salesQuery, saleDateRange, saleLocation } from "@/api/salesClient";
import { isDegraded, isSnapshot } from "@/api/salesWire";
import { readCatalog, CATALOG_ITEMS, CATALOG_PENDING } from "@/api/catalogChannel";

/**
 * WHAT FILLS THE RIBBON WHEN NO CATALOG HAS ITEMS IN IT.
 *
 * The standing inventory, and these are the business's own photographs rather
 * than stock: the same nine files /categories uses for the matching category, so
 * the hero shows things this business actually buys and costs no new bytes.
 * Landscapes from a stock library would be actively wrong on a page whose entire
 * claim is "this is the kind of thing we deal in".
 *
 * Neither hero-before.webp nor hero-after.webp is here. Dealing one of the
 * removed hero image's photographs back onto the same screen is not what
 * removing it meant.
 */
const STANDING_ITEMS = [
  { id: "toys", imageUrl: "/img/3065f1e9c_generated_image.webp" },
  { id: "griswold", imageUrl: "/img/96588d74a_generated_image.webp" },
  { id: "jewelry", imageUrl: "/img/f3522ea84_generated_image.webp" },
  { id: "uranium", imageUrl: "/img/2f04db7ab_generated_image.webp" },
  { id: "cards", imageUrl: "/img/b72c0acb4_generated_image.webp" },
  { id: "decor", imageUrl: "/img/2ac325373_generated_image.webp" },
  { id: "pipes", imageUrl: "/img/ac93609f7_generated_image.webp" },
  { id: "pens", imageUrl: "/img/63ce2e7e9_generated_image.webp" },
  { id: "uv", imageUrl: "/img/0bf12dc53_generated_image.webp" },
];

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
 * the hero image from the website"). The vendored CSS marquee that briefly
 * replaced it is gone too: it could not be coupled to scroll velocity, which is
 * what "rubbery" needed, so HeroCardRibbon replaces it as the hero's asset.
 *
 * BeforeAfterSlider.jsx STAYS: /for-professionals renders its own before/after
 * with it, so deleting it to tidy up would break that page.
 *
 * NO "SEE UPCOMING SALES" BUTTON HERE, on Ben's call: it belongs at the bottom of
 * How It Works and at the bottom of the page, where somebody has read enough to
 * want it. The hero keeps the two actions it has always converted on, the phone
 * number and a free evaluation, plus the anchor down to How It Works.
 *
 * WHEN A CATALOG IS PUBLISHED it appears as one button in the bottom-right corner
 * of the hero, on the spot Ben marked on a screenshot. It was a strip under the
 * buttons in the left column first; both existed together for about ten minutes
 * and the duplication was the whole argument against it. Either way the point
 * stands: the newest sale gets an announcement without a voice louder than the
 * business's own name.
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
   * The catalog button renders only when a feed that ANSWERED gave us a sale.
   * Degraded and snapshot both fall through to nothing, because this is above the
   * fold and two of those states are a static file — the same rule as
   * /upcoming-sales, for the same reason. An absent button claims nothing; a
   * present one is always true.
   */
  const trustworthy = !isLoading && !isDegraded(data) && !isSnapshot();
  const sale = trustworthy ? newestCatalog(data?.upcoming) : null;
  const count = sale ? catalogCount(sale.catalog) : null;
  const dates = sale ? saleDateRange(sale, format) : "";
  const where = sale ? saleLocation(sale) : "";

  /*
   * Real catalog photographs the moment the platform publishes any, the standing
   * inventory until then — Ben's "the current items if no catalogs exist, but new
   * catalog items when catalogs arrive".
   *
   * Only CATALOG_ITEMS qualifies. A catalog in the PENDING state has told us how
   * many items it holds and sent none of them, which is exactly today's live
   * shape ({slug, itemCount}), and there is nothing to put in a card. Falling
   * back is right there: an empty ribbon would be a worse answer than the
   * standing one, and a placeholder card per promised item would be inventing
   * photographs the feed never sent.
   */
  const published = sale ? readCatalog(sale.catalog) : null;
  const ribbonItems =
    published?.state === CATALOG_ITEMS && published.items.length ? published.items : STANDING_ITEMS;

  const rise = (delay) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  return (
    <KineticGrid globalColor="monochrome" className="min-h-[100dvh]">
      {/* The hero's image asset, beside the type rather than behind it. */}
      <HeroCardRibbon items={ribbonItems} />

      {/*
        NOT max-w-7xl mx-auto, unlike every section below it, and that is the
        change rather than an oversight. Ben: move the hero text farther left. The
        centred 1280px container put the headline 120px in at 1440; hugging the
        page padding starts it at 40px.

        The cost, stated so nobody spends time "fixing" it: the hero's left edge
        no longer lines up with the sections underneath, which do centre. That is
        the trade he asked for, and it reads as intent because the hero is
        full-bleed and they are not.
      */}
      {/* The bottom padding grows on a phone WHEN THERE IS A CATALOG BUTTON,
          and only then. The button is absolutely positioned, so on a narrow
          screen it lands on top of the "How We Get It Done" link instead of
          beside anything — the copy has to be pushed up to make room, and
          reserving that room unconditionally would leave a gap under the
          hero on every day there is no sale, which is most of them. */}
      <div
        className={`relative z-10 min-h-[100dvh] flex items-center px-6 md:px-10 pt-24 ${
          sale?.slug ? "pb-44 md:pb-20" : "pb-20"
        }`}
      >
        <div className="w-full">
          <div className="max-w-2xl">
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
            </motion.div>

            {/*
              A LINK, NOT A THIRD BUTTON. Three buttons of three different widths
              wrapped two-and-one in the narrower column this hero now uses, which
              is the exact fault docs/UI-PRINCIPLES.md §9 recorded against the old
              hero. Ben's own markup of the page shows two buttons. So the two
              that convert stay buttons and the one that only moves you down the
              page becomes what it always was.

              Smooth by CSS rather than a handler here: see the html rule in
              src/index.css and the scroll-margin that clears the fixed nav.
            */}
            <motion.a
              {...rise(0.58)}
              href="#services"
              className="mt-6 inline-flex items-center gap-2 font-heading font-bold text-sm uppercase tracking-widest text-white/70 hover:text-accent transition-colors"
            >
              How We Get It Done
              <ArrowDown className="w-4 h-4" />
            </motion.a>

            {showForm && (
              <div className="mt-6 max-w-lg">
                <HeroLeadForm />
              </div>
            )}

          </div>
        </div>
      </div>

      {/*
        THE NEWEST CATALOG, AS ONE BUTTON IN THE BOTTOM-RIGHT OF THE HERO. Ben
        marked the spot on a screenshot. One button, for the newest catalog only —
        newestCatalog() already picks a single sale, and a row of them here would
        be a second /upcoming-sales competing with the headline.

        It renders on exactly the same condition as the panel in the left column:
        a feed that ANSWERED and gave us a sale with a slug. Degraded feeds and
        snapshots fall through to nothing, because a button promising a catalog
        that 404s is worse than no button, and a static file cannot know.

        IT REPLACED A PANEL IN THE LEFT COLUMN that said the same words. That
        panel had the dates, the location and the item count, so those moved in
        here rather than being dropped — one affordance carrying everything,
        which is what "one displayed" has to mean when the alternative is the
        same catalog announced twice on one screen.

        It sits higher on a phone than on a desktop because the scroll cue is
        centred at the hero's foot and they would otherwise overlap.
      */}
      {sale?.slug && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-20 right-6 md:bottom-8 md:right-10 z-20 max-w-[calc(100%-3rem)] md:max-w-sm"
        >
          <Link
            to={`/sale/${sale.slug}`}
            className="group flex items-center gap-4 border-2 border-white/25 bg-black/70 px-5 py-4 backdrop-blur-sm transition-colors hover:border-accent hover:bg-black/85"
          >
            <span className="min-w-0">
              <span className="block font-heading text-accent text-[0.65rem] uppercase tracking-[0.3em] mb-1">
                Newest Catalog
              </span>
              <span className="block truncate font-heading font-black text-white text-base lg:text-lg uppercase tracking-tight">
                {sale.title}
              </span>
              {/* Only what the feed actually stated. saleDateRange and
                  saleLocation return "" for a sale that carries neither, and
                  catalogCount returns null unless the catalog counted itself —
                  so an incomplete sale loses this line rather than printing an
                  empty one or a zero. */}
              {(dates || where || count) && (
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-heading text-white/55 text-[0.65rem] uppercase tracking-wider font-bold">
                  {dates && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {dates}
                    </span>
                  )}
                  {where && <span>{where}</span>}
                  {count && (
                    <span className="inline-flex items-center gap-1.5">
                      <Images className="w-3 h-3" />
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  )}
                </span>
              )}
            </span>
            <ArrowRight className="w-5 h-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        </motion.div>
      )}

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
