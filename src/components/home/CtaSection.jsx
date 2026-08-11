import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Send, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLeadForm, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";

const ITEM_TYPES = [
  "Records & Music", "Toys & Collectibles", "Military & Weapons",
  "Jewelry", "Signs & Advertising", "Sports & Cards",
  "Furniture", "Art", "Full Estate", "Other",
];

export default function CtaSection() {
  const [form, setForm] = useState({ name: "", phone: "", property_address: "", item_type: "" });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { honeypotField, submit } = useLeadForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please provide your name and phone number.");
      return;
    }
    setSending(true);

    const result = await submit("home_cta_evaluation", {
      name: form.name,
      phone: form.phone,
      propertyAddress: form.property_address || undefined,
      message: form.item_type ? `Item type: ${form.item_type}` : undefined,
      payload: form.item_type ? { itemType: form.item_type } : undefined,
    });

    setSending(false);
    if (!result.ok) {
      toast.error(`${result.message} Or call ${CONTACT_PHONE}.`);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-24 bg-accent">
        <div className="max-w-2xl mx-auto px-6 md:px-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="font-heading font-black text-white text-4xl md:text-5xl uppercase tracking-tight mb-4">
              We Got It!
            </h2>
            <p className="text-white/80 text-lg mb-6">
              We'll be in touch shortly. Or call us right now:
            </p>
            <a
              href="tel:4129697757"
              className="inline-flex items-center gap-3 bg-white text-foreground px-8 py-4 font-heading font-black text-2xl uppercase hover:bg-white/90 transition-colors"
            >
              <Phone className="w-6 h-6" />
              412-969-7757
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-accent">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading font-black text-white text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
            Get Your Free<br />Evaluation
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Fill out the quick form below — or call us directly. We come to you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 space-y-5">
            {honeypotField}
            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="cta-name" className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Name *</Label>
                <Input
                  id="cta-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="h-12 border-2 border-foreground/20 focus:border-foreground bg-transparent"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta-phone" className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Phone *</Label>
                <Input
                  id="cta-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Your phone number"
                  className="h-12 border-2 border-foreground/20 focus:border-foreground bg-transparent"
                />
              </div>
            </div>

            {/* Property Address */}
            <div className="space-y-1.5">
              <Label htmlFor="cta-address" className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Property Address</Label>
              <Input
                id="cta-address"
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                placeholder="123 Main St, Pittsburgh, PA"
                className="h-12 border-2 border-foreground/20 focus:border-foreground bg-transparent"
              />
            </div>

            {/* Item Type */}
            <div className="space-y-2">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Item Type</Label>
              <div className="flex flex-wrap gap-2">
                {ITEM_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, item_type: type === form.item_type ? "" : type })}
                    className={`text-xs font-heading font-bold uppercase px-3 py-2 border-2 transition-colors ${
                      form.item_type === type
                        ? "bg-accent border-accent text-white"
                        : "border-foreground/20 text-foreground hover:border-accent"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos travel by text: there is no upload endpoint, and an
                uploader that silently discards files is the bug we are fixing. */}
            <p className="text-foreground/50 text-sm">
              Got photos? Text them to{" "}
              <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-accent hover:underline">
                {CONTACT_PHONE}
              </a>{" "}
              after you send this.
            </p>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 items-center pt-1">
              <Button
                type="submit"
                disabled={sending}
                className="w-full sm:flex-1 h-14 bg-accent text-white hover:bg-accent/90 font-heading font-black text-lg uppercase tracking-wide transition-colors"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Request Free Evaluation
                  </span>
                )}
              </Button>
              <span className="text-foreground/40 text-sm font-heading uppercase">or</span>
              <a
                href="tel:4129697757"
                className="inline-flex items-center gap-2 border-2 border-foreground/20 px-6 h-14 font-heading font-black text-xl uppercase hover:border-accent hover:text-accent transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}