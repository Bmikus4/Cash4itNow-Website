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

/**
 * The catalog's item shape is not pinned by the contract yet, so both of the
 * plausible ones are accepted: a bare image URL, or an object carrying one.
 * Anything else is skipped rather than rendered as a broken tile.
 */
function catalogEntries(catalog) {
  if (!Array.isArray(catalog)) return [];
  return catalog
    .map((entry) => {
      if (typeof entry === "string") return { imageUrl: entry, title: "" };
      if (entry && typeof entry === "object" && entry.imageUrl) {
        return { imageUrl: entry.imageUrl, title: entry.title || "" };
      }
      return null;
    })
    .filter(Boolean);
}

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
  usePageMeta(
    sale ? [sale.title, where && `Estate Sale in ${where}`].filter(Boolean).join(" — ") : "Estate Sale",
    // City and state only. The contract withholds the street address until 48
    // hours before the doors open, and a description is the last place it should
    // leak from — search engines cache it.
    sale ? [[where, when].filter(Boolean).join(", "), sale.description].filter(Boolean).join(". ") : null
  );

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

  const photos = catalogEntries(sale.catalog);

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

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-heading font-black text-2xl uppercase tracking-tight">Sale Preview Photos</h2>
          <div className="h-1 bg-accent w-16 mb-8 mt-1" />
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <figure key={i} className="border-2 border-foreground/10 overflow-hidden group">
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
          ) : (
            <p className="text-muted-foreground text-sm">
              {isUpcoming ? "No photos yet — check back closer to the sale date." : "No photos from this sale."}
            </p>
          )}
        </motion.section>
      </div>
    </div>
  );
}
