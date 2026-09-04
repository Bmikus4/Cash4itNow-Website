import React, { useState } from "react";
import { MessageSquare, Loader2, Check } from "lucide-react";
import { useLeadForm } from "@/api/leadForm";

/**
 * The message names the sale, always.
 *
 * The server dedupes on formId|phone|message over 24 hours and cannot see
 * `payload`, where the sale identity used to live alone. One phone signing up
 * for two different sales in a day therefore sent sale_coupon, the same phone
 * and two empty messages: identical hash, second dropped, no row. Coupon
 * issuance reads that row, so the visitor simply never receives the coupon they
 * asked for.
 *
 * This form has no free-text field, so there is nothing of the visitor's to
 * append here. If one is ever added, append it to this summary rather than
 * replacing it — a message that only names the sale when the note is empty
 * collides again for two people who type the same thing.
 */
function couponMessage(sale) {
  const identity = sale.slug || sale.startsAt || sale.date || "unscheduled";
  return `Coupon signup for "${sale.title}" (${identity})`;
}

/*
 * THE PANEL IS THE ACCENT, OPAQUE. Not a tint of it, and not a darker relative
 * of it either — both were tried on Ben's screen and both were wrong.
 *
 * It began as `bg-accent/10`. A tint has no colour of its own: it takes its
 * darkness from whatever it is over, and this panel is rendered on both of the
 * site's bands. Every colour in this component is written for the dark one, so
 * on /upcoming-sales — whose cards sit on the WHITE band — it composited to pale
 * pink with white text on it, which is unreadable rather than merely off-brand.
 * On the sale page's black band the same class came out #2A1919, a grey-brown
 * that read as a shadow. One class, two wrong answers, both looking deliberate.
 *
 * A dedicated dark red (--accent-deep, 22% lightness) fixed the readability and
 * failed the other half: "too dark/doesn't match". It was the only maroon thing
 * on a page whose dates, links and buttons are all one specific red, and a
 * near-miss of a brand colour reads as a mistake in a way a different colour
 * does not. That token is gone; nothing else had asked for it.
 *
 * So the panel is `bg-accent` — the same red as the phone button, the badge and
 * the section headings, matching by construction rather than by eye — and
 * everything on it is white, including the SEND button, which had to invert
 * because a red button on red is not a button. White on this red is 6.4:1 and
 * white at 85% is 4.9:1, so the small print clears AA as well.
 */
export default function SaleCouponSignup({ sale }) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { honeypotField, submit } = useLeadForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    const result = await submit("sale_coupon", {
      phone: phone.trim(),
      message: couponMessage(sale),
      payload: {
        saleTitle: sale.title,
        saleSlug: sale.slug || undefined,
        saleDate: sale.startsAt || sale.date || undefined,
      },
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-4 bg-accent p-3 flex items-center gap-2">
        <Check className="w-4 h-4 text-white flex-shrink-0" />
        <p className="text-white/85 text-xs leading-snug">
          You're in! We'll text your <strong>10% off</strong> coupon for the second day of the sale.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-accent p-3">
      {honeypotField}
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-white flex-shrink-0" />
        <p className="font-heading font-black text-white text-xs uppercase tracking-wider leading-tight">
          Get 10% Off — Day 2
        </p>
      </div>
      <p className="text-white/85 text-xs mb-2.5 leading-snug">
        Enter your number and we'll text you a coupon for the second day of the sale.
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number"
          className="flex-1 h-9 bg-white text-foreground px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/70"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-white text-accent font-heading font-black text-xs uppercase tracking-wider px-3 h-9 hover:bg-white/90 transition-colors disabled:opacity-60 flex items-center justify-center"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
        </button>
      </div>
      {error && <p className="text-white/85 text-xs mt-2 leading-snug">{error}</p>}
    </form>
  );
}