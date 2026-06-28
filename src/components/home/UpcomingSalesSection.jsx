import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, ArrowRight, Plus, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import AdminSaleForm from "@/components/sales/AdminSaleForm";
import SaleCouponSignup from "@/components/sales/SaleCouponSignup";
import AdminOwnerInfo from "@/components/sales/AdminOwnerInfo";
import CountdownTimer from "@/components/sales/CountdownTimer";

export default function UpcomingSalesSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["upcoming-sales"],
    queryFn: () => base44.entities.UpcomingSale.list("date", 10),
  });

  if (isLoading || (sales.length === 0 && !isAdmin)) return null;

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

        {isAdmin && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 border-2 border-background/30 text-background/70 hover:border-accent hover:text-accent font-heading font-black text-xs uppercase tracking-widest px-5 py-2.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Sale
            </button>
          </div>
        )}

        {sales.length === 0 && isAdmin && (
          <p className="text-center text-background/40 font-heading text-sm uppercase tracking-widest">No upcoming sales yet. Add one above.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sales.map((sale, i) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-2 border-background/20 bg-background/5 flex flex-col group"
            >
              {sale.image_url && (
                <div className="overflow-hidden">
                  <img
                    src={sale.image_url}
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
                      {format(new Date(sale.date), "MMMM d, yyyy")}
                    </span>
                  </div>
                  {sale.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-background/50 flex-shrink-0" />
                      <span className="font-heading text-background/70 text-sm uppercase tracking-wider font-bold">
                        {sale.time}
                      </span>
                    </div>
                  )}
                  {sale.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sale.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 group/addr mt-0.5"
                    >
                      <MapPin className="w-4 h-4 text-background/50 flex-shrink-0 mt-0.5" />
                      <span className="text-background/60 text-sm leading-snug group-hover/addr:text-accent transition-colors">
                        {sale.address}
                      </span>
                    </a>
                  )}
                </div>
                <h3 className="font-heading font-black text-background text-xl uppercase tracking-tight mb-2">
                  {sale.title}
                </h3>
                {sale.description && (
                  <p className="text-background/60 text-sm leading-relaxed flex-1 line-clamp-3">{sale.description}</p>
                )}
                <Link
                  to={`/sale/${sale.id}`}
                  className="inline-flex items-center gap-2 mt-5 font-heading font-black text-xs uppercase tracking-widest text-accent hover:text-background transition-colors"
                >
                  View Sale Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <CountdownTimer date={sale.date} time={sale.time} />
                <SaleCouponSignup sale={sale} />
                {isAdmin && <AdminOwnerInfo sale={sale} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showForm && (
        <AdminSaleForm
          sale={null}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["upcoming-sales"] });
            setShowForm(false);
          }}
        />
      )}
    </section>
  );
}