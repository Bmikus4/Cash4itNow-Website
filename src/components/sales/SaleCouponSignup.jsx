import React, { useState } from "react";
import { MessageSquare, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SaleCouponSignup({ sale }) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    await base44.entities.CouponRequest.create({
      phone: phone.trim(),
      sale_title: sale.title,
      sale_date: sale.date || null,
    });
    setSending(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-4 border-2 border-accent/40 bg-accent/10 p-3 flex items-center gap-2">
        <Check className="w-4 h-4 text-accent flex-shrink-0" />
        <p className="text-background/80 text-xs leading-snug">
          You're in! We'll text your <strong>10% off</strong> coupon for the second day of the sale.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-2 border-accent/40 bg-accent/10 p-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
        <p className="font-heading font-black text-background text-xs uppercase tracking-wider leading-tight">
          Get 10% Off — Day 2
        </p>
      </div>
      <p className="text-background/60 text-xs mb-2.5 leading-snug">
        Enter your number and we'll text you a coupon for the second day of the sale.
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number"
          className="flex-1 h-9 bg-background border border-foreground/20 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-accent text-white font-heading font-black text-xs uppercase tracking-wider px-3 h-9 hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
        </button>
      </div>
    </form>
  );
}