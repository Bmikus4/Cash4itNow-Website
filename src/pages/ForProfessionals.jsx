import React from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight, ClipboardCheck, Tag, Truck, Home } from "lucide-react";
import { Link } from "react-router-dom";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";
import { useLeadForm, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, breadcrumbGraph } from "@/lib/structuredData";

/**
 * The four steps in the order the property moves through them. The wording is
 * lifted from the site's own hero and property-services copy rather than written
 * fresh — the hero already said "evaluating the assets, conducting the sale, to
 * getting the home and property ready for sale"; it just was not a headline.
 */
const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Evaluate",
    body: "We walk the property and price what is there. No charge, and no obligation to sell through us.",
  },
  {
    icon: Tag,
    title: "Sell the contents",
    body: "An on-site estate sale, or an outright cash purchase where a sale is not worth the days. Whichever pays your client more.",
  },
  {
    icon: Truck,
    title: "Clear the rest",
    body: "Everything unsold goes. The house is left broom-clean, which is where most listings stall.",
  },
  {
    icon: Home,
    title: "Get it listing-ready",
    body: "Repairs and touch-ups, cosmetic refreshes, a deep clean, and exterior work — yard, power washing, paint.",
  },
];

/**
 * DIVISION OF LABOUR — NOT SHIPPED, AND DELIBERATELY NOT.
 *
 * §8.1 proposes: "We do the sale and the clearout. Trades are our vetted crews,
 * managed by us, billed through us."
 *
 * That is a proposed sentence in a plan, not a verified fact about the business,
 * and it is a factual claim aimed at professionals who will stake their
 * reputation on it. Nobody here knows which of those trades are in-house and
 * which are partners, so the page ships the part that is true either way — one
 * point of contact — and leaves the specific claim to Ben. Same class as the
 * testimonials: the moment copy becomes a claim to a third party, it is his.
 *
 * When he confirms, replace HONESTY_BODY with his wording. Do not infer it, and
 * do not delete this section to avoid the question: its absence is the trust gap
 * §8.1 identifies, because unsubstantiated breadth is what reads as a lead-gen
 * middleman.
 */
const HONESTY_BODY =
  "You get one number to call and one crew scheduling the work. We would rather tell you up front how the work is staffed than have you find out halfway through a listing — ask us on the first call and you will get a straight answer.";

export default function ForProfessionals() {
  const { honeypotField, submit } = useLeadForm();
  const [form, setForm] = React.useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  usePageMeta({
    title: "For Realtors, Attorneys & Executors",
    description:
      "One vendor for an estate listing: evaluate, sell the contents, clear the rest, and get the property listing-ready. Serving realtors, estate attorneys and executors across Pittsburgh and Western Pennsylvania.",
  });
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: "For Realtors, Attorneys & Executors", path: "/for-professionals" },
    ])
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Please enter your name and a phone number.");
      return;
    }
    setSending(true);
    const result = await submit("referrer_enquiry", {
      name: form.name,
      phone: form.phone,
      message: form.message || undefined,
    });
    setSending(false);
    if (!result.ok) {
      setError(`${result.message} Or call ${CONTACT_PHONE}.`);
      return;
    }
    setSent(true);
    setError("");
  };

  return (
    <div className="pt-16 bg-background">
      {/* Outcome first, service list second */}
      <section className="bg-foreground px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-4">
              For Realtors, Attorneys &amp; Executors
            </p>
            <h1 className="font-heading font-black text-background text-4xl md:text-6xl uppercase leading-[0.95] tracking-tight mb-4">
              Your house, sold-ready — inside and out
            </h1>
            <p className="font-heading font-bold text-accent text-xl md:text-2xl uppercase tracking-wide mb-6">
              One vendor, one point of contact
            </p>
            <div className="h-1.5 bg-accent w-24 mb-6" />
            <p className="text-background/70 text-lg leading-relaxed max-w-2xl mb-10">
              A complete estate service from evaluating the assets, conducting the sale, to getting the home and
              property ready for sale. You hand us the keys and a date; we hand back a house that shows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                {CONTACT_PHONE}
              </a>
              <a
                href="#refer"
                className="inline-flex items-center justify-center gap-2 border-2 border-background text-background px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-background/10 transition-colors"
              >
                Refer a property
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The sequence */}
      <section className="px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-tight mb-2">
            Four steps, one invoice trail
          </h2>
          <div className="h-1.5 bg-accent w-24 mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-foreground">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 md:p-8 border-b border-foreground/15 md:[&:nth-child(odd)]:border-r"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-accent text-white w-9 h-9 flex items-center justify-center font-heading font-black text-sm">
                    {i + 1}
                  </span>
                  <step.icon className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-black text-lg uppercase tracking-tight">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof. One slider, because one genuine before/after pair exists in the
          repo — the estate cleanout. Do not fake the others by pairing unrelated
          stock photographs: a proof panel that is not proof is worse than none to
          this audience. */}
      <section className="bg-muted/40 px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-tight mb-2">
            What "cleared" looks like
          </h2>
          <div className="h-1.5 bg-accent w-24 mb-4" />
          <p className="text-muted-foreground mb-8 max-w-2xl">
            One property, before the contents were sold and after the clearout. Drag the handle.
          </p>
          <div className="relative w-full h-[60vh] border-4 border-foreground">
            <BeforeAfterSlider
              beforeSrc="/hero-before.webp"
              afterSrc="/hero-after.webp"
              beforeLabel="Before"
              afterLabel="After"
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* The honesty statement. See HONESTY_BODY above before editing. */}
      <section className="px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-3xl mx-auto border-2 border-foreground p-6 md:p-10">
          <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-tight mb-2">
            How the work is staffed
          </h2>
          <div className="h-1.5 bg-accent w-24 mb-6" />
          <p className="text-muted-foreground text-lg leading-relaxed">{HONESTY_BODY}</p>
        </div>
      </section>

      {/* Refer a property */}
      <section id="refer" className="bg-accent px-6 md:px-10 py-14 md:py-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading font-black text-white text-3xl md:text-4xl uppercase tracking-tight mb-3">
            Refer a property
          </h2>
          <p className="text-white/80 mb-8">
            Your name and a number is enough. We call you, not your client, unless you ask otherwise.
          </p>
          {sent ? (
            <p className="font-heading font-black text-white uppercase tracking-widest">
              Thank you — we will call you.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="bg-background p-6 space-y-4 text-left">
              {honeypotField}
              <div className="space-y-1.5">
                <label className="font-heading text-xs uppercase tracking-widest">Your Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-heading text-xs uppercase tracking-widest">Phone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-heading text-xs uppercase tracking-widest">The property (optional)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Township, and what state it is in."
                />
              </div>
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-foreground text-background font-heading font-black text-sm uppercase tracking-widest px-6 py-4 hover:bg-foreground/90 transition-colors disabled:opacity-60"
              >
                {sending ? "Sending..." : "Refer this property"}
              </button>
            </form>
          )}
          <p className="text-white/70 text-sm mt-6">
            Or call{" "}
            <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-white hover:underline">
              {CONTACT_PHONE}
            </a>
            . <Link to="/about" className="underline hover:text-white">Who we are</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
