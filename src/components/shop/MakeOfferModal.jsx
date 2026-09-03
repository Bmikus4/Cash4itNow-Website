import React, { useState } from "react";
import { X, Loader2, Handshake } from "lucide-react";
import { useLeadForm, CONTACT_PHONE } from "@/api/leadForm";
import { toast } from "sonner";

/**
 * The message identifies the item, ALWAYS — never only when the visitor leaves
 * the note blank.
 *
 * The server dedupes on formId|phone|message over 24 hours and cannot see
 * `payload`, so two offers on two different items from one phone hash
 * identically unless the item is in the message. The second is dropped as a
 * duplicate and nothing anywhere records it: offer on a dresser, then on a
 * mirror, and the mirror is gone. A fallback-only version has the same hole for
 * anyone who types the same note twice, which is why the summary is prefixed
 * rather than substituted.
 */
function offerMessage(item, form) {
  const summary = `Offer $${form.offer} on "${item.title}" (item ${item.id}, listed $${item.price})`;
  return form.message ? `${summary}\n\n${form.message}` : summary;
}

export default function MakeOfferModal({ item, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", offer: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { honeypotField, submit } = useLeadForm();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Every offer is forwarded and a human decides. The old auto-reject below 75%
  // of list ran in a stub that never reached anyone, and a machine turning a
  // buyer away is a lost negotiation, not a saved one.
  //
  // A contact method is required, but phone OR email — not phone as the other
  // two item_offer call sites do. An offer is a lower-commitment act than
  // booking a walkthrough and some people will not hand over a number for one,
  // so demanding a phone costs real offers where demanding *something* costs
  // none.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!form.name) missing.push("your name");
    if (!form.offer) missing.push("an offer amount");
    if (!form.phone && !form.email) missing.push("a phone number or an email");
    if (missing.length) {
      const last = missing.pop();
      toast.error(`Please enter ${[missing.join(", "), last].filter(Boolean).join(" and ")}.`);
      return;
    }
    setSubmitting(true);
    const result = await submit("item_offer", {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      message: offerMessage(item, form),
      payload: {
        itemId: item.id,
        itemTitle: item.title,
        listedPrice: item.price,
        offerAmount: form.offer,
      },
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(`${result.message} Or call ${CONTACT_PHONE}.`);
      return;
    }
    toast.success(result.message);
    onClose();
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
          {honeypotField}
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
          <p className="text-muted-foreground text-xs">
            Give us a phone number or an email — whichever you prefer. We cannot reply to an
            offer without one.
          </p>

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