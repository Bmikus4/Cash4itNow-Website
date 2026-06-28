import React, { useState } from "react";
import { X, Phone, Mail, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CheckoutModal({ item, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please fill in your name and phone number.");
      return;
    }
    setSending(true);

    await base44.integrations.Core.SendEmail({
      to: "info@cash4itnow.com",
      subject: `Purchase Inquiry: ${item.title} ($${item.price})`,
      body: `New purchase inquiry from the website:\n\nItem: ${item.title}\nPrice: $${item.price}\n\nFrom:\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMessage:\n${form.message || "No message provided."}`,
    });

    setSending(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/70">
      <div className="bg-background w-full max-w-lg border-2 border-foreground relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-foreground px-6 py-4 flex items-start justify-between">
          <div>
            <p className="font-heading text-accent text-xs uppercase tracking-widest">Purchase Inquiry</p>
            <h2 className="font-heading font-black text-background text-xl uppercase tracking-tight leading-tight mt-0.5">
              {item.title}
            </h2>
          </div>
          <button onClick={onClose} className="text-background/60 hover:text-background transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-accent flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-black text-2xl uppercase mb-2">Inquiry Sent!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                We'll contact you shortly to arrange payment and pickup/shipping.
              </p>
              <Button onClick={onClose} className="font-heading font-black uppercase bg-foreground text-background hover:bg-accent">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Item summary */}
              <div className="flex gap-4 mb-6 p-4 bg-muted border border-foreground/20">
                {item.photo_urls?.[0] && (
                  <img src={item.photo_urls[0]} alt={item.title} className="w-20 h-20 object-cover border border-foreground/20 flex-shrink-0" />
                )}
                <div>
                  <p className="font-heading font-black text-foreground uppercase text-sm">{item.title}</p>
                  {item.condition && <p className="text-muted-foreground text-xs mt-0.5">{item.condition}</p>}
                  <p className="font-heading font-black text-accent text-2xl mt-1">${Number(item.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Payment note */}
              <div className="border-l-4 border-accent pl-4 mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fill out the form below and we'll contact you to arrange payment via cash, Venmo, Zelle, or PayPal — and coordinate pickup or shipping.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-11 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Phone *</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your phone" className="h-11 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="h-11 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Message (optional)</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Any questions or special requests?" rows={3} className="border-2 border-foreground/30 bg-transparent focus:border-foreground resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-heading font-black uppercase border-2 border-foreground">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sending} className="flex-1 h-12 bg-accent text-white hover:bg-accent/90 font-heading font-black text-base uppercase tracking-wide">
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </span>
                    )}
                  </Button>
                </div>

                {/* Alt contact */}
                <div className="flex items-center gap-2 justify-center pt-1">
                  <span className="text-xs text-muted-foreground">Or call us directly:</span>
                  <a href="tel:4129697757" className="text-xs font-heading font-black text-accent uppercase hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 412-969-7757
                  </a>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}