import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { useLeadForm, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";

const INPUT_CLASS =
  "w-full h-12 bg-background/10 border-2 border-background/30 text-background placeholder-background/40 px-4 text-sm focus:outline-none focus:border-accent transition-colors";

/**
 * The hero's second CTA. Three fields, because the visitor is two seconds into
 * the page — the Contact page's step 2 exists for everything else.
 */
export default function HeroLeadForm() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { honeypotField, submit } = useLeadForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Name and phone, please.");
      return;
    }
    setSending(true);
    const result = await submit("hero_evaluation", {
      name: form.name,
      phone: form.phone,
      message: form.message || undefined,
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
      <div className="border-2 border-accent bg-accent/10 p-5 flex items-start gap-3">
        <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-heading font-black text-background uppercase tracking-wide">We've got it</p>
          <p className="text-background/70 text-sm mt-1">
            We'll call {form.phone} shortly. Sooner is fine too:{" "}
            <a href={CONTACT_PHONE_HREF} className="font-heading font-bold text-accent hover:underline">
              {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="border-2 border-background/30 p-5 space-y-3"
    >
      {honeypotField}
      <p className="font-heading font-black text-background text-sm uppercase tracking-widest">
        Free Evaluation
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name"
          aria-label="Your name"
          className={INPUT_CLASS}
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Your phone"
          aria-label="Your phone"
          className={INPUT_CLASS}
        />
      </div>
      <input
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="What do you have? (optional)"
        aria-label="What do you have"
        className={INPUT_CLASS}
      />
      {error && <p className="text-accent text-sm">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white h-12 font-heading font-black text-base uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {sending ? "Sending…" : "Get My Evaluation"}
      </button>
    </motion.form>
  );
}
