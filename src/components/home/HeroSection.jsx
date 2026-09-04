import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, ArrowDown, ChevronRight, ArrowRight, Calendar, Images } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import HeroLeadForm from "@/components/home/HeroLeadForm";
import HeroCardRibbon from "@/components/home/HeroCardRibbon";
import Wordmark from "@/components/brand/Wordmark";
import KineticGrid from "@/components/ui/kinetic-grid";
import { salesQuery, saleDateRange, saleLocation, saleStartTime } from "@/api/salesClient";
import { isDegraded, isSnapshot } from "@/api/salesWire";
import { readCatalog, CATALOG_ITEMS, CATALOG_PENDING } from "@/api/catalogChannel";
import { catalogQuery } from "@/api/catalogClient";
import { FEED_ITEMS } from "@/api/catalogFeed";

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
 * HOW MANY OF A CATALOGUE'S PHOTOGRAPHS THE RIBBON TAKES.
 *
 * PER ROW, and the ribbon has three, so up to 36. It used to be twelve in total,
 * which was the wrong unit: the three rows each took the whole list and walked it
 * with their own stride, so a screen showing eighteen cards could only ever show
 * twelve pictures. Ben, watching that: "each row uses like the same 12 images."
 * The rows now take a third of the list each (see share() in HeroCardRibbon), so
 * a row's twelve are twelve nobody else can be showing.
 *
 * Twelve is what the band needs, not a round number. Twelve 204px cards make
 * 2448px against a band of about 1530px, so one copy of a row's own list still
 * covers the loop with no seam, and twelve is one of the sizes the stride rule was
 * searched exhaustively at for the case where the pool is too small to split.
 *
 * THE CEILING IS ABOUT BYTES. Each catalogue photograph is a ~154KB webp served
 * `Cache-Control: private`, so 36 of them is 5.5MB above the fold and a hundred
 * would be fifteen. Thirty-six is already more than can be on screen at once —
 * about eighteen cards are unmasked at 1853 — so raising it buys nothing a visitor
 * can see.
 */
const RIBBON_MAX = 12;

/** The rows share the pool, so the pool is that much bigger. Kept in step with ROWS in the ribbon. */
const RIBBON_ROWS = 3;

/**
 * `count` items taken EVENLY ACROSS the list rather than off the front.
 *
 * A catalogue is entered in the order somebody photographed the house, so the
 * first twelve rows of a 34-item sale are one corner of one room. Spreading the
 * sample is the difference between "here is what this sale is" and "here is the
 * shelf they started on". It is a pure function of the length, so two builds of
 * one commit cannot differ — which is what the prerender crawl exists to catch.
 */
function spread(list, count) {
  if (list.length <= count) return list;
  const out = [];
  for (let k = 0; k < count; k++) out.push(list[Math.round((k * list.length) / count)]);
  return out;
}

/**
 * THIRTY-SIX SLOTS, twelve per row. The newest catalogue fills as many as it can
 * and the standing inventory fills the rest.
 *
 * Topping up is not a hedge, it is the only way a small catalogue can be shown at
 * all. A sale with two published photographs is a real state — the live feed had
 * one this week — and two photographs in a ribbon that needs a dozen is the SAME
 * PICTURE four times in one row, which does not read as "here is the sale", it
 * reads as broken.
 *
 * The pool is handed over WHOLE and the ribbon splits it three ways, so a top-up
 * lands across all three rows rather than turning one of them into the standing
 * row. Deduplicated by imageUrl, because a standing photograph is one of this
 * business's own and could perfectly well be in the catalogue too.
 */
function fill(items) {
  const picked = spread(items, RIBBON_MAX * RIBBON_ROWS);
  if (picked.length >= RIBBON_MAX * RIBBON_ROWS) return picked;
  const seen = new Set(picked.map((item) => item.imageUrl));
  const rest = STANDING_ITEMS.filter((item) => !seen.has(item.imageUrl));
  return [...picked, ...rest].slice(0, RIBBON_MAX * RIBBON_ROWS);
}

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
 * THE CATALOG BUTTON in the bottom-right corner is always present, on the spot
 * Ben marked on a screenshot. It names the newest sale and links to it when the
 * feed has given us one, and falls back to Upcoming Sales when it has not — so
 * there is always somewhere to go, and never a claim that a catalog exists when
 * none has been published. It was a strip under the buttons in the left column
 * first; both existed together for about ten minutes and the duplication was the
 * whole argument against it.
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
   * `sale` is set only by a feed that ANSWERED. Degraded and snapshot both leave
   * it null, because this is above the fold and two of those states are a static
   * file — the same rule as /upcoming-sales, for the same reason. The button
   * still renders in those states; it just falls back to the calendar page
   * instead of naming a sale. Nothing specific is ever printed from a null.
   */
  const trustworthy = !isLoading && !isDegraded(data) && !isSnapshot();
  const sale = trustworthy ? newestCatalog(data?.upcoming) : null;
  const count = sale ? catalogCount(sale.catalog) : null;
  const dates = sale ? saleDateRange(sale, format) : "";
  const where = sale ? saleLocation(sale) : "";

  /*
   * Real catalog photographs the moment the platform publishes any, the standing
   * inventory until then — Ben's "the current items if no catalogs exist, but new
   * catalog items when catalogs arrive", and later, when it was still showing the
   * standing nine over a sale with 34 published photographs: "home screen should
   * ALWAYS be populated with the newest catalogs photos".
   *
   * IT TOOK A SECOND REQUEST, and that is why it had never happened. The sales
   * feed carries a catalogue REFERENCE and not its items — {slug, itemCount} — so
   * every real sale reads as CATALOG_PENDING here, and the hero treated PENDING
   * as the end of the road. It is not: /api/public/catalog?slug= answers with the
   * items, which is the same second question SalePage has been asking since it
   * shipped. The hero now asks it too, for the newest sale only.
   *
   * The request is made ONLY for a reference that says there is something to
   * fetch. ABSENT and EMPTY are final answers, and a snapshot or a degraded sales
   * feed leaves `sale` null, so the prerendered HTML asks nothing and ships the
   * standing inventory — the same rule the rest of this page runs on.
   *
   * A FAILED LOOKUP CANNOT MAKE THE HERO WORSE than it was: only FEED_ITEMS moves
   * it off the standing photographs. A 404, a 503, an unreachable host and an
   * unparseable body all leave the ribbon exactly as it was, because an empty
   * ribbon would be a worse answer than the standing one and a placeholder card
   * per promised item would be inventing photographs the feed never sent.
   */
  /*
   * THE SALE CARDS THAT SIT IN THE RIBBON, one per row, ALWAYS.
   *
   * Derived here rather than in the ribbon because this is the only place that
   * knows whether the feed can be believed, and the card's three states turn on
   * exactly that: a real sale, "no upcoming events" when the feed ANSWERED and
   * there is nothing, and a claimless "upcoming events" when we could not ask —
   * a degraded feed, or any prerendered snapshot, which is built with no feed by
   * design. Collapsing the last two would bake "nothing scheduled" into a static
   * file on a day the calendar is full. See HeroSaleCard, which states the rule.
   *
   * A sale with no location or no readable start is dropped rather than shown
   * with a blank half; if that leaves nothing, the empty card takes over.
   *
   * THE SHAPE IS FLATTENED HERE rather than handed to the card whole, because
   * every decision about what will fit in a 384px card — "MMM d" and not
   * "October 11, 2026", the date and door time joined on one line, the time
   * dropped entirely when the feed did not state one — is a decision about the
   * SENTENCE, and belongs beside the helpers that build it. The card renders
   * strings; it does not know what a Sale is.
   *
   * `address` is read straight off the entry and is almost always absent: the
   * contract withholds a street until 48 hours before the doors. It only ever
   * reaches the clipboard, never the card's face.
   */
  const saleCards = useMemo(() => {
    if (!trustworthy) return [{ id: "pending", kind: "pending" }];
    const list = Array.isArray(data?.upcoming) ? data.upcoming : [];
    const cards = list
      .map((entry) => {
        const start = entry?.startsAt ? new Date(entry.startsAt) : null;
        const where = saleLocation(entry);
        if (!where || !start || Number.isNaN(start.getTime())) return null;
        const day = format(start, "MMM d");
        const time = saleStartTime(entry, format);
        return {
          id: entry.slug || `${where}-${entry.startsAt}`,
          kind: "sale",
          location: where,
          when: time ? `${day} · ${time}` : day,
          address: typeof entry.address === "string" ? entry.address.trim() : "",
        };
      })
      .filter(Boolean);
    return cards.length ? cards : [{ id: "none", kind: "none" }];
  }, [trustworthy, data]);

  const published = sale ? readCatalog(sale.catalog) : null;
  const publishedItems = useQuery(
    catalogQuery(published?.reference, published?.state === CATALOG_PENDING)
  );
  const ribbonItems = useMemo(() => {
    const inline = published?.state === CATALOG_ITEMS ? published.items : [];
    const fetched =
      published?.state === CATALOG_PENDING && publishedItems.data?.state === FEED_ITEMS
        ? publishedItems.data.items
        : [];
    return fill(inline.length ? inline : fetched);
  }, [published?.state, published?.items, publishedItems.data]);

  const rise = (delay) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  return (
    <KineticGrid globalColor="monochrome" className="min-h-[100dvh]">
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
      {/* The extra bottom padding on a phone is room for the catalog button,
          which is absolutely positioned and would otherwise land on top of the
          "How We Get It Done" link rather than beside anything. It used to be
          conditional, to avoid a gap under the hero on the days there was no
          sale; the button is unconditional now, so this is too. */}
      {/*
        pointer-events-none ON THE WRAPPER, auto on the copy inside it.

        This block is full-width and full-height at z-10, so on a desktop it lies
        across the whole ribbon — and a transparent element is still a hit
        target. Everything in the band was therefore unclickable from the moment
        the ribbon gained a control: the See More link and the copy button on the
        sale cards were being hit-tested against this div instead. The two
        affordances that are meant to sit over the ribbon (the catalog button and
        the copy column itself) turn their own events back on; the empty space
        between them does not, and lets the cards underneath answer.
      */}
      <div className="pointer-events-none relative z-10 min-h-[100dvh] flex items-center px-6 md:px-10 pt-24 pb-44 md:pb-20">
        <div className="w-full">
          <div className="pointer-events-auto max-w-2xl">
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
              <Wordmark />
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

      {/*
        THE NEWEST CATALOG, AS ONE BUTTON IN THE BOTTOM-RIGHT OF THE HERO. Ben
        marked the spot on a screenshot. One button, for the newest catalog only —
        newestCatalog() already picks a single sale, and a row of them here would
        be a second /upcoming-sales competing with the headline.

        IT IS ALWAYS THERE, and it changes what it says rather than whether it
        exists. With a catalog it names that sale and goes to it; without one it
        says Upcoming Sales and goes to /upcoming-sales. That covers the two
        states where it used to vanish — a feed that could not answer, and a
        prerendered snapshot, which has no feed by design — and in both of those
        the fallback is the honest destination anyway: the calendar page, which
        can say for itself what is and is not scheduled.

        WHAT IT MUST NEVER DO is name a catalog it has not been told about. Every
        line that says something specific is gated on sale?.slug, so the fallback
        promises only a page that always exists.

        IT REPLACED A PANEL IN THE LEFT COLUMN that said the same words. That
        panel had the dates, the location and the item count, so those moved in
        here rather than being dropped — one affordance carrying everything,
        which is what "one displayed" has to mean when the alternative is the
        same catalog announced twice on one screen.

        It sits higher on a phone than on a desktop because the scroll cue is
        centred at the hero's foot and they would otherwise overlap.

        IT IS ANCHORED TO THE COPY, not to the section. On a phone the section is
        now a screen of copy FOLLOWED BY a band of cards, so a button positioned
        against the section would land at the foot of the cards, a screen and a
        half below the headline it belongs to. Against the copy block it stays
        where Ben marked it on both layouts. Same for the scroll cue underneath.
      */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pointer-events-auto absolute bottom-20 right-6 md:bottom-8 md:right-10 z-20 max-w-[calc(100%-3rem)] md:max-w-sm"
      >
          <Link
            to={sale?.slug ? `/sale/${sale.slug}` : "/upcoming-sales"}
            className="group flex items-center gap-4 border-2 border-white/25 bg-black/70 px-5 py-4 backdrop-blur-sm transition-colors hover:border-accent hover:bg-black/85"
          >
            <span className="min-w-0">
              <span className="block font-heading text-accent text-[0.65rem] uppercase tracking-[0.3em] mb-1">
                {sale?.slug ? "Newest Catalog" : "Coming Up"}
              </span>
              <span className="block truncate font-heading font-black text-white text-base lg:text-lg uppercase tracking-tight">
                {sale?.slug ? sale.title : "Upcoming Sales"}
              </span>
              {/* Only what the feed actually stated. saleDateRange and
                  saleLocation return "" for a sale that carries neither, and
                  catalogCount returns null unless the catalog counted itself —
                  so an incomplete sale loses this line rather than printing an
                  empty one or a zero. */}
              {sale?.slug && (dates || where || count) && (
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
      </div>

      {/*
        THE HERO'S IMAGE ASSET, AND IT COMES AFTER THE COPY IN THE MARKUP NOW.
        On a phone that is exactly where it renders: a band of its own below the
        headline. From md up the ribbon is absolutely placed and z-0, so the
        document order does not reach the layout at all and it is still the
        right-hand asset beside the type. Ordering it this way round is what
        makes the phone case need no second copy of the component.
      */}
      <HeroCardRibbon items={ribbonItems} sales={saleCards} />
    </KineticGrid>
  );
}
