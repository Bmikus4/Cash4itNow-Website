import React from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Clock, MapPin, Images } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { saleDateRange, saleLocation, saleStartTime } from "@/api/salesClient";
import { readCatalog, CATALOG_ITEMS, CATALOG_PENDING } from "@/api/catalogChannel";
import CountdownTimer from "@/components/sales/CountdownTimer";
import SaleCouponSignup from "@/components/sales/SaleCouponSignup";

/**
 * One sale, rendered the same way wherever a sale is listed.
 *
 * Extracted because it is now listed in two places — the home page band and
 * /upcoming-sales — and a second hand-written copy is the defect this repo has
 * paid for repeatedly: two representations of one thing, drifting the moment
 * either is edited. The card is the representation; the pages choose only the
 * tone and what surrounds it.
 *
 * TONE, NOT THEME. The site is single-theme (docs/UI-PRINCIPLES.md §2); what
 * alternates is the BAND a section sits on. So this takes the band's colour, not
 * a light/dark mode: "dark" for a bg-foreground band, "light" for bg-background.
 * Getting it wrong is visible immediately rather than subtly, which is the point.
 */
const TONES = {
  dark: {
    card: "border-2 border-background/20 bg-background/5",
    title: "text-background",
    body: "text-background/60",
    meta: "text-background/70",
    metaIcon: "text-background/50",
    link: "text-accent hover:text-background",
  },
  light: {
    card: "border-2 border-foreground",
    title: "text-foreground",
    body: "text-muted-foreground",
    meta: "text-foreground/70",
    metaIcon: "text-foreground/40",
    link: "text-accent hover:text-foreground",
  },
};

/**
 * What the catalog line may say, and what it must not.
 *
 * Only ITEMS and a counted PENDING carry a number the feed actually stated.
 * PENDING with no count, EMPTY and ABSENT all render nothing: a catalog channel
 * that has published no number is not a catalog of zero items, and this is the
 * one card on the site whose whole subject is the catalog, so it is the worst
 * place to invent one. See src/api/catalogChannel.js for why those four states
 * are kept apart.
 */
function catalogLabel(catalog) {
  const read = readCatalog(catalog);
  const counted = read.state === CATALOG_ITEMS || read.state === CATALOG_PENDING;
  if (!counted || !Number.isFinite(read.count) || read.count <= 0) return null;
  return `${read.count} ${read.count === 1 ? "item" : "items"} catalogued`;
}

export default function SaleCard({ sale, index = 0, tone = "dark", showSignup = true }) {
  const t = TONES[tone] ?? TONES.dark;
  const dates = saleDateRange(sale, format);
  const startTime = saleStartTime(sale, format);
  const where = saleLocation(sale);
  const catalog = catalogLabel(sale.catalog);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 5) * 0.08 }}
      className={`${t.card} flex flex-col group`}
    >
      {sale.imageUrl && (
        <div className="overflow-hidden">
          <img
            src={sale.imageUrl}
            alt={sale.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex flex-col gap-1.5 mb-3">
          {dates && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="font-heading text-accent text-sm uppercase tracking-wider font-bold">{dates}</span>
            </div>
          )}
          {/* THE DOOR TIME, restored from the Base44 export's card, where it was its own line
              under the date with a clock beside it. The export read a free-text `time` field; the
              feed carries `startsAt` as a real instant, so the same line is derived from that
              rather than from a second column somebody has to remember to fill in. */}
          {startTime && (
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 flex-shrink-0 ${t.metaIcon}`} />
              <span className={`font-heading text-sm uppercase tracking-wider font-bold ${t.meta}`}>
                {startTime}
              </span>
            </div>
          )}
          {/* THE EXPORT LINKED THE FULL STREET ADDRESS TO GOOGLE MAPS HERE. THAT LINE IS NOT
              CARRIED OVER, and it is the one thing on this card that is deliberately not verbatim.
              The contract withholds a sale's address until 48 hours before the doors open; the
              public feed does not send one, `SalePage` states the rule at length, and
              `check-event-schema.mjs` fails if an address reaches the structured data. Restoring
              the link would publish a stranger's house to anyone who loads the home page. City and
              state, which is what `saleLocation` returns and all it returns. */}
          {where && (
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 flex-shrink-0 ${t.metaIcon}`} />
              <span className={`font-heading text-sm uppercase tracking-wider font-bold ${t.meta}`}>{where}</span>
            </div>
          )}
          {catalog && (
            <div className="flex items-center gap-2">
              <Images className={`w-4 h-4 flex-shrink-0 ${t.metaIcon}`} />
              <span className={`font-heading text-sm uppercase tracking-wider font-bold ${t.meta}`}>{catalog}</span>
            </div>
          )}
        </div>

        <h3 className={`font-heading font-black text-xl uppercase tracking-tight mb-2 ${t.title}`}>{sale.title}</h3>

        {sale.description && (
          <p className={`text-sm leading-relaxed flex-1 line-clamp-3 ${t.body}`}>{sale.description}</p>
        )}

        <Link
          to={`/sale/${sale.slug}`}
          className={`inline-flex items-center gap-2 mt-5 font-heading font-black text-xs uppercase tracking-widest transition-colors ${t.link}`}
        >
          View Sale Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <CountdownTimer startsAt={sale.startsAt} />
        {showSignup && <SaleCouponSignup sale={sale} />}
      </div>
    </motion.div>
  );
}
