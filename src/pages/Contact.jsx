import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, CalendarDays, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLeadForm, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";

const TIME_SLOTS = [
  "Morning (8am-12pm)",
  "Afternoon (12pm-4pm)",
  "Evening (4pm-7pm)",
  "Flexible - Any Time",
];

const ITEM_TYPES = [
  "Records & Music", "Toys & Collectibles", "Military & Weapons",
  "Jewelry", "Signs & Advertising", "Sports & Cards",
  "Furniture", "Art", "Full Estate", "Other",
];

const FIELD_CLASS = "h-12 border-2 border-foreground/30 bg-transparent focus:border-foreground";
const CHIP_CLASS = "text-xs font-heading font-bold uppercase px-3 py-2 border-2 transition-colors";

/**
 * Capture then enrich.
 *
 * The form this replaces asked for eight fields, a date, a time slot, a
 * category and up to eight photos before anything was recorded — every one of
 * them a place to abandon, and abandoning meant no lead at all. Step 1 is now
 * the four fields worth having (phone > address > what they have) and the lead
 * is safe the moment it submits. Everything else is asked for afterwards, on
 * the thank-you state, and can be skipped without cost.
 */
export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", property_address: "", message: "" });
  const [sending, setSending] = useState(false);
  const [captured, setCaptured] = useState(false);

  const [extra, setExtra] = useState({ preferred_date: "", preferred_time: "", item_type: "" });
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);

  const { honeypotField, submit } = useLeadForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in Name, Phone, and what you have.");
      return;
    }
    setSending(true);
    const result = await submit("contact_page_evaluation", {
      name: form.name,
      phone: form.phone,
      propertyAddress: form.property_address || undefined,
      message: form.message,
    });
    setSending(false);
    if (!result.ok) {
      toast.error(`${result.message} Or call ${CONTACT_PHONE}.`);
      return;
    }
    setCaptured(true);
  };

  // Step 2 posts as its own lead carrying the same name and phone. The endpoint
  // returns no id by design, so the pipeline joins the two on the phone number —
  // do not "simplify" this by dropping name/phone from the enrichment body.
  const handleEnrich = async (e) => {
    e.preventDefault();
    setEnriching(true);
    const result = await submit("contact_page_evaluation", {
      name: form.name,
      phone: form.phone,
      propertyAddress: form.property_address || undefined,
      payload: {
        step: "enrichment",
        preferredDate: extra.preferred_date || undefined,
        preferredTime: extra.preferred_time || undefined,
        itemType: extra.item_type || undefined,
      },
    });
    setEnriching(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setEnriched(true);
  };

  const hasExtra = extra.preferred_date || extra.preferred_time || extra.item_type;

  return (
    <div className="pt-16 bg-background">
      {/* Header */}
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Cash 4 It Now</p>
            <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
              Contact Us
            </h1>
            <div className="h-1.5 bg-accent w-24" />
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 md:gap-16">
            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Big phone CTA */}
              <a
                href={CONTACT_PHONE_HREF}
                className="flex items-center gap-4 bg-accent text-white p-6 hover:bg-accent/90 transition-colors group"
              >
                <Phone className="w-8 h-8 flex-shrink-0" />
                <div>
                  <p className="font-heading font-black text-3xl uppercase leading-none">{CONTACT_PHONE}</p>
                  <p className="text-white/80 text-sm mt-1">Call for a free evaluation</p>
                </div>
              </a>

              <div className="border-2 border-foreground p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-bold text-foreground uppercase text-sm">Email / Website</p>
                    <a href="mailto:info@cash4itnow.com" className="text-muted-foreground text-sm hover:text-accent transition-colors">
                      Cash4itnow.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-bold text-foreground uppercase text-sm">Service Area</p>
                    <p className="text-muted-foreground text-sm">Pittsburgh, PA &amp; Western Pennsylvania</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-bold text-foreground uppercase text-sm">Availability</p>
                    <p className="text-muted-foreground text-sm">7 Days a Week — We work around your schedule</p>
                  </div>
                </div>
              </div>

              <div className="bg-foreground p-6">
                <p className="font-heading font-black text-background text-2xl uppercase mb-2">Veteran-Owned</p>
                <p className="text-background/60 text-sm leading-relaxed">
                  We treat every customer with the same respect and integrity we learned through our service.
                </p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <div className="border-2 border-foreground p-8 md:p-10">
                {captured ? (
                  <>
                    <div className="flex items-start gap-3 mb-1">
                      <div className="w-8 h-8 bg-accent flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="font-heading font-black text-foreground text-3xl uppercase tracking-tight leading-tight">
                        We've Got Your Details
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm mb-8">
                      We'll call {form.phone} shortly. Need us sooner?{" "}
                      <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-accent hover:underline">
                        {CONTACT_PHONE}
                      </a>
                    </p>

                    {enriched ? (
                      <div className="border-2 border-accent/40 bg-accent/5 p-6">
                        <p className="font-heading font-black text-foreground text-lg uppercase tracking-tight mb-1">
                          Thanks — that helps
                        </p>
                        <p className="text-muted-foreground text-sm">
                          We'll come prepared for what you have and work around your window.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleEnrich} className="space-y-5">
                        <div>
                          <p className="font-heading font-black text-foreground text-lg uppercase tracking-tight">
                            Anything else? Optional
                          </p>
                          <p className="text-muted-foreground text-sm">
                            None of this is needed — it just means we arrive ready.
                          </p>
                        </div>

                        {/* Item type */}
                        <div className="space-y-2">
                          <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">What kind of items?</Label>
                          <div className="flex flex-wrap gap-2">
                            {ITEM_TYPES.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setExtra({ ...extra, item_type: type === extra.item_type ? "" : type })}
                                className={`${CHIP_CLASS} ${
                                  extra.item_type === type
                                    ? "bg-accent border-accent text-white"
                                    : "border-foreground/30 text-foreground hover:border-foreground"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preferred visit window */}
                        <div className="border-2 border-accent/30 bg-accent/5 p-5 space-y-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="w-4 h-4 text-accent" />
                            <span className="font-heading font-black text-foreground text-sm uppercase tracking-widest">Preferred Visit Window</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                              <Label htmlFor="preferred_date" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Date</Label>
                              <Input
                                id="preferred_date"
                                type="date"
                                value={extra.preferred_date}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setExtra({ ...extra, preferred_date: e.target.value })}
                                className="h-12 border-2 border-foreground/30 bg-background focus:border-foreground"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Time</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {TIME_SLOTS.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setExtra({ ...extra, preferred_time: slot === extra.preferred_time ? "" : slot })}
                                    className={`${CHIP_CLASS} px-2 leading-tight ${
                                      extra.preferred_time === slot
                                        ? "bg-accent border-accent text-white"
                                        : "border-foreground/30 text-foreground hover:border-foreground"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Photos travel by text: there is no upload endpoint, and
                            an uploader that discards files is the bug being fixed. */}
                        <p className="text-muted-foreground text-sm">
                          Have photos? Text them to{" "}
                          <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-accent hover:underline">
                            {CONTACT_PHONE}
                          </a>{" "}
                          and we'll match them to your request.
                        </p>

                        <Button
                          type="submit"
                          disabled={enriching || !hasExtra}
                          className="w-full h-14 bg-foreground text-background hover:bg-accent font-heading font-black text-lg uppercase tracking-wide transition-colors disabled:opacity-40"
                        >
                          {enriching ? "Sending…" : "Send These Details Too"}
                        </Button>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="font-heading font-black text-foreground text-3xl uppercase tracking-tight mb-1">
                      Request an Evaluation
                    </h2>
                    <p className="text-muted-foreground text-sm mb-8">
                      Four things and we'll call you. Everything else can wait.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {honeypotField}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Name *</Label>
                          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={FIELD_CLASS} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Phone *</Label>
                          <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your phone number" className={FIELD_CLASS} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="property_address" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Property Address</Label>
                        <Input id="property_address" value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} placeholder="123 Main St, Pittsburgh, PA" className={FIELD_CLASS} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">What do you have? *</Label>
                        <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A sentence is plenty — full house, a record collection, grandad's tools…" rows={3} className="border-2 border-foreground/30 bg-transparent focus:border-foreground resize-none" />
                      </div>

                      <Button
                        type="submit"
                        disabled={sending}
                        className="w-full h-14 bg-foreground text-background hover:bg-accent font-heading font-black text-lg uppercase tracking-wide transition-colors"
                      >
                        {sending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            Submitting…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Request Evaluation
                          </span>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
