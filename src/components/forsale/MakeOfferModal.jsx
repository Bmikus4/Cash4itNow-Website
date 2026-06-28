import React, { useState } from "react";
import { X, Loader2, Handshake } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MakeOfferModal({ item, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", offer: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.offer) {
      toast.error("Please enter your name and an offer amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("processOffer", {
        item_title: item.title,
        item_id: item.id,
        listed_price: item.price,
        offer_amount: form.offer,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        message: form.message,
      });
      const result = res.data || res;
      if (result.status === "considered") {
        toast.success("Your offer is being considered. We'll be in touch soon!");
      } else {
        toast.error("We're unable to accept offers below 75% of the listed price.");
      }
      onClose();
    } catch (err) {
      toast.error("Something went wrong. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background w-full max-w-md border-2 border-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-foreground">
          <h2 className="font-heading font-black text-background text-lg uppercase tracking-widest flex items-center gap-2">
            <Handshake className="w-5 h-5" /> Make an Offer
          </h2>
          <button onClick={onClose} className="text-background/60 hover:text-background">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted/40 border border-foreground/10 p-3">
            <p className="font-heading font-black text-sm uppercase tracking-tight">{item.title}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Listed at ${Number(item.price).toFixed(2)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-heading text-xs uppercase tracking-widest">Your Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-heading text-xs uppercase tracking-widest">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="you@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-heading text-xs uppercase tracking-widest">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-heading text-xs uppercase tracking-widest">Your Offer ($) *</label>
            <input
              name="offer"
              type="number"
              min="0"
              step="0.01"
              value={form.offer}
              onChange={handleChange}
              className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-heading text-xs uppercase tracking-widest">Message (optional)</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              className="w-full border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Add any details about your offer..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-foreground/20 font-heading font-black text-xs uppercase tracking-wider px-4 py-3 hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-heading font-black text-xs uppercase tracking-wider px-4 py-3 hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}