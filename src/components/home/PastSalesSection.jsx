import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarCheck, MapPin } from "lucide-react";
import { format } from "date-fns";
import { salesQuery, saleDateRange, saleGridClass, saleLocation } from "@/api/salesClient";
import { sectionMode } from "@/api/salesWire";

export default function PastSalesSection() {
  const { data, isLoading } = useQuery(salesQuery());
  const sales = data?.past ?? [];
  const mode = sectionMode(data, sales);

  // THIS SECTION STAYS SILENT WHEN THE FEED IS DEGRADED, and that is a page-level
  // decision rather than an oversight: `UpcomingSalesSection` owns the notice, so
  // the home page tells the visitor once. Two identical apologies stacked down
  // one page reads as a broken site rather than an honest one.
  //
  // The STATE is still distinguished here — `mode` is "unavailable", not
  // "hidden" — so a future change that wants to say something in this section
  // has the fact available and does not have to re-derive it from an empty list.
  // Past sales are proof of work, not something a customer is waiting on; the
  // sale they need is upcoming, which is where the notice and the phone number
  // are.
  if (isLoading || mode !== "list") return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Proven Results</p>
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-foreground leading-[0.9] mb-2">
            Past Sales
          </h2>
          <div className="h-1.5 bg-accent w-24 mt-3 mb-4" />
          <p className="text-muted-foreground max-w-xl">
            See what we've accomplished for our clients — successful estate liquidations throughout the Pittsburgh area.
          </p>
        </motion.div>

        <div className={`grid gap-6 ${saleGridClass(sales.length)}`}>
          {sales.map((sale, i) => (
            <motion.div
              key={sale.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="border-2 border-foreground/10 bg-card flex flex-col group"
            >
              {sale.imageUrl && (
                <div className="overflow-hidden">
                  <img
                    src={sale.imageUrl}
                    alt={sale.title}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1 gap-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-heading font-bold uppercase tracking-wider text-accent">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {saleDateRange(sale, format)}
                  </span>
                  {saleLocation(sale) && (
                    <span className="flex items-center gap-1.5 font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {saleLocation(sale)}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-black text-foreground text-xl uppercase tracking-tight leading-tight">
                  {sale.title}
                </h3>

                {sale.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">{sale.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
