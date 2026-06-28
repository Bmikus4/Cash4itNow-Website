import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowLeft, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import AdminSaleForm from "@/components/sales/AdminSaleForm";
import SaleRoomGallery from "@/components/sales/SaleRoomGallery";

export default function SalePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => base44.entities.UpcomingSale.filter({ id }),
    select: (data) => data[0],
  });

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

  const mapsUrl = sale.address
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${encodeURIComponent(sale.address)}`
    : null;

  const directionsUrl = sale.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sale.address)}`
    : null;

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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="font-heading text-accent text-sm uppercase tracking-wider font-bold">
                  {format(new Date(sale.date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <h1 className="font-heading font-black text-background text-4xl md:text-6xl uppercase tracking-tight leading-[0.9] mb-4">
                {sale.title}
              </h1>
              {sale.address && (
                <div className="flex items-start gap-2 text-background/70">
                  <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="font-body text-sm">{sale.address}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex-shrink-0 inline-flex items-center gap-2 bg-accent text-white font-heading font-black text-xs uppercase tracking-widest px-4 py-3 hover:bg-accent/90 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Sale
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-14">
        {/* Description */}
        {sale.description && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">About This Sale</h2>
            <div className="h-1 bg-accent w-16 mb-5" />
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">{sale.description}</p>
          </motion.section>
        )}

        {/* Map */}
        {sale.address && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">Location</h2>
            <div className="h-1 bg-accent w-16 mb-5" />
            <div className="border-2 border-foreground overflow-hidden">
              <iframe
                title="Sale Location"
                width="100%"
                height="380"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={mapsUrl}
              />
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-foreground text-background font-heading font-black text-sm uppercase tracking-widest px-6 py-3 hover:bg-accent transition-colors"
            >
              <MapPin className="w-4 h-4" /> Get Directions
            </a>
          </motion.section>
        )}

        {/* Room Photos */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight">Sale Preview Photos</h2>
          </div>
          <div className="h-1 bg-accent w-16 mb-8" />
          {sale.rooms && sale.rooms.length > 0 ? (
            <SaleRoomGallery rooms={sale.rooms} />
          ) : (
            <p className="text-muted-foreground text-sm">No photos yet — check back closer to the sale date.</p>
          )}
        </motion.section>
      </div>

      {showForm && (
        <AdminSaleForm
          sale={sale}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["sale", id] });
            queryClient.invalidateQueries({ queryKey: ["upcoming-sales"] });
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}