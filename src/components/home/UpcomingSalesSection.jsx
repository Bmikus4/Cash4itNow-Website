import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { fetchSales, saleDateRange, saleGridClass, saleLocation, SALES_QUERY_KEY } from "@/api/salesClient";
import SaleCouponSignup from "@/components/sales/SaleCouponSignup";
import CountdownTimer from "@/components/sales/CountdownTimer";
import { useJsonLd, saleEventsGraph } from "@/lib/structuredData";

export default function UpcomingSalesSection() {
  const { data, isLoading } = useQuery({ queryKey: SALES_QUERY_KEY, queryFn: fetchSales });
  const sales = data?.upcoming ?? [];

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

  // Nothing scheduled is not a failure state: the section leaves the page
  // rather than advertising an empty shelf.
  if (isLoading || sales.length === 0) return null;

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

        <div className={`grid gap-6 ${saleGridClass(sales.length)}`}>
          {sales.map((sale, i) => (
            <motion.div
              key={sale.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-2 border-background/20 bg-background/5 flex flex-col group"
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
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="font-heading text-accent text-sm uppercase tracking-wider font-bold">
                      {saleDateRange(sale, format)}
                    </span>
                  </div>
                  {saleLocation(sale) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-background/50 flex-shrink-0" />
                      <span className="font-heading text-background/70 text-sm uppercase tracking-wider font-bold">
                        {saleLocation(sale)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-heading font-black text-background text-xl uppercase tracking-tight mb-2">
                  {sale.title}
                </h3>
                {sale.description && (
                  <p className="text-background/60 text-sm leading-relaxed flex-1 line-clamp-3">{sale.description}</p>
                )}
                <Link
                  to={`/sale/${sale.slug}`}
                  className="inline-flex items-center gap-2 mt-5 font-heading font-black text-xs uppercase tracking-widest text-accent hover:text-background transition-colors"
                >
                  View Sale Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <CountdownTimer startsAt={sale.startsAt} />
                <SaleCouponSignup sale={sale} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
