import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fetchSales, saleDateRange, saleLocation, SALES_QUERY_KEY } from "@/api/salesClient";
import CountdownTimer from "@/components/sales/CountdownTimer";
import SaleCouponSignup from "@/components/sales/SaleCouponSignup";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, breadcrumbGraph, saleEventGraph } from "@/lib/structuredData";

import { readCatalog, CATALOG_ABSENT, CATALOG_EMPTY, CATALOG_PENDING } from "@/api/catalogChannel";

export default function SalePage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({ queryKey: SALES_QUERY_KEY, queryFn: fetchSales });

  const sale = [...(data?.upcoming ?? []), ...(data?.past ?? [])].find((s) => s.slug === slug);
  const isUpcoming = (data?.upcoming ?? []).some((s) => s.slug === slug);

  // Before the early returns: the loading and not-found states are pages a
  // person can sit on, and they need a title too. The town is in it because
  // "estate sale in Mount Lebanon" is what someone actually searches.
  const where = sale ? saleLocation(sale) : "";
  const when = sale ? saleDateRange(sale, format) : "";
  // RULE: city and state only, NEVER the street address.
  //
  // The contract withholds a sale's street address until 48 hours before the
  // doors open, and a search snippet is the worst place for it to leak from,
  // because the snippet outlives the page: it is fetched once, cached, and served
  // long after this sale is over and the house is empty. `saleLocation()` returns
  // city and state and nothing else — do not "improve" this by reaching for an
  // address field, whichever way the feed later carries one.
  usePageMeta({
    title: sale ? [sale.title, where && `Estate Sale in ${where}`].filter(Boolean).join(" — ") : "Estate Sale",
    description: sale
      ? [[where, when].filter(Boolean).join(", "), sale.description].filter(Boolean).join(". ")
      : undefined,
  });
  useJsonLd(
    "breadcrumb",
    sale
      ? breadcrumbGraph([
          { name: "Home", path: "/" },
          { name: sale.title, path: `/sale/${slug}` },
        ])
      : null
  );
  // The canonical home for this Event: the page the Event is about. It is also
  // emitted on the home page, because /sale/:slug is not prerendered until
  // Phase 1 and a graph only here reaches no crawler that does not run JS. Same
  // @id in both places, so it is one event described twice rather than two.
  //
  // Past sales get nothing. An Event in the past is not wrong, but the feed
  // classifies these and we do not second-guess it — and a sale that has already
  // happened is not what §8.3 wants surfaced. saleEventGraph returns null on a
  // sale with no usable start date, so a malformed Event cannot be emitted here.
  useJsonLd("event", sale && isUpcoming ? saleEventGraph(sale) : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-foreground/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-heading text-xl uppercase">Sale not found.</p>
        <Link to="/" className="text-accent underline font-heading text-sm uppercase">Back to Home</Link>
      </div>
    );
  }

  const catalog = readCatalog(sale.catalog);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-foreground py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-background/50 hover:text-background font-heading text-xs uppercase tracking-widest mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="font-heading text-accent text-sm uppercase tracking-wider font-bold">
                  {saleDateRange(sale, format)}
                </span>
              </div>
              <h1 className="font-heading font-black text-background text-4xl md:text-6xl uppercase tracking-tight leading-[0.9] mb-4">
                {sale.title}
              </h1>
              {saleLocation(sale) && (
                <div className="flex items-start gap-2 text-background/70">
                  <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="font-body text-sm">{saleLocation(sale)}</span>
                </div>
              )}
            </div>

            {isUpcoming && (
              <div className="w-full md:w-72 flex-shrink-0">
                <CountdownTimer startsAt={sale.startsAt} />
                <SaleCouponSignup sale={sale} />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-14">
        {sale.description && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">About This Sale</h2>
            <div className="h-1 bg-accent w-16 mb-5" />
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">{sale.description}</p>
          </motion.section>
        )}

        {/* The street address is released 48 hours ahead, so the page says so
            rather than leaving a visitor hunting for a location block. */}
        {isUpcoming && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">Location</h2>
            <div className="h-1 bg-accent w-16 mb-5" />
            <div className="border-2 border-foreground p-6">
              <p className="font-heading font-black text-foreground text-xl uppercase tracking-tight mb-2">
                {saleLocation(sale) || "Pittsburgh area"}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                The full street address goes out 48 hours before the doors open. Leave your number above and we'll
                text it to you along with your coupon.
              </p>
            </div>
          </motion.section>
        )}

        {/* FOUR STATES, AND THE SECTION IS ABSENT FOR ONE OF THEM.

            When no catalog has been published for this sale, the page says
            NOTHING — no heading, no apology. The previous version rendered "No
            photos yet — check back closer to the sale date" here, and because the
            real feed publishes a reference rather than an array, that sentence
            was shown for every real sale: a confident claim about photographs
            that the channel to carry them had never existed to hold. A heading
            with an apology under it is a worse answer than no section, because it
            invites a visitor to come back for something nobody has promised.

            Do not "simplify" this back into `photos.length > 0`. That collapse is
            the F3d defect itself; scripts/check-catalog-states.mjs fails if it
            returns. */}
        {catalog.state !== CATALOG_ABSENT && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight">Sale Preview Photos</h2>
            <div className="h-1 bg-accent w-16 mb-8 mt-1" />

            {catalog.items.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {catalog.items.map((photo, i) => (
                  <figure key={photo.id} className="border-2 border-foreground/10 overflow-hidden group">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title || `${sale.title} preview ${i + 1}`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {photo.title && (
                      <figcaption className="font-heading font-bold text-xs uppercase tracking-widest text-muted-foreground px-3 py-2">
                        {photo.title}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {/* The feed told us this catalog holds items and did not send them.
                Saying "no photos" here would state the opposite of what we were
                just told. The count is printed only when the feed gave one — an
                unknown count is not zero. */}
            {catalog.state === CATALOG_PENDING && (
              <p className="text-muted-foreground text-sm">
                {catalog.count
                  ? `${catalog.count} items are catalogued for this sale. The photographs are not published yet — `
                  : "This sale has a catalogue. The photographs are not published yet — "}
                {isUpcoming ? "they go up before the doors open." : "get in touch and we will tell you what was in it."}
              </p>
            )}

            {catalog.state === CATALOG_EMPTY && (
              <p className="text-muted-foreground text-sm">
                {isUpcoming ? "No photos yet — check back closer to the sale date." : "No photos from this sale."}
              </p>
            )}
          </motion.section>
        )}
      </div>
    </div>
  );
}
