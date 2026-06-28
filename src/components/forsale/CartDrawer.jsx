import React, { useState } from "react";
import { X, Trash2, ShoppingCart, Send, Phone } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CartDrawer({ onClose }) {
  const { cartItems, removeFromCart, clearCart, total } = useCart();
  const [step, setStep] = useState("cart"); // "cart" | "checkout" | "success"
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please fill in your name and phone number.");
      return;
    }
    setSending(true);

    const itemList = cartItems.map((i) => `• ${i.title} — $${Number(i.price).toFixed(2)}`).join("\n");

    await base44.integrations.Core.SendEmail({
      to: "info@cash4itnow.com",
      subject: `Cart Inquiry: ${cartItems.length} item(s) — $${total.toFixed(2)}`,
      body: `New cart inquiry from the website:\n\nItems:\n${itemList}\n\nTotal: $${total.toFixed(2)}\n\nFrom:\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMessage:\n${form.message || "No message provided."}`,
    });

    setSending(false);
    setStep("success");
    clearCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l-2 border-foreground flex flex-col h-full">
        {/* Header */}
        <div className="bg-foreground px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-black text-background text-xl uppercase tracking-tight">
              {step === "checkout" ? "Checkout" : "Your Cart"}
            </h2>
          </div>
          <button onClick={onClose} className="text-background/60 hover:text-background transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === "success" ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-accent flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-black text-2xl uppercase mb-2">Inquiry Sent!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                We'll contact you shortly to arrange payment and pickup/shipping.
              </p>
              <Button onClick={onClose} className="font-heading font-black uppercase bg-foreground text-background hover:bg-accent">
                Continue Shopping
              </Button>
            </div>
          ) : step === "checkout" ? (
            <div className="p-6">
              {/* Order summary */}
              <div className="border-2 border-foreground/20 p-4 mb-6">
                <p className="font-heading font-black text-xs uppercase tracking-widest text-muted-foreground mb-3">Order Summary</p>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-foreground/10 last:border-0">
                    <span className="font-heading font-bold text-foreground uppercase text-xs leading-tight flex-1 pr-2">{item.title}</span>
                    <span className="font-heading font-black text-accent text-sm flex-shrink-0">${Number(item.price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-1">
                  <span className="font-heading font-black text-foreground uppercase tracking-wide">Total</span>
                  <span className="font-heading font-black text-accent text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-l-4 border-accent pl-4 mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We'll contact you to arrange payment via cash, Venmo, Zelle, or PayPal — and coordinate pickup or shipping.
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
                  <Button type="button" variant="outline" onClick={() => setStep("cart")} className="flex-1 font-heading font-black uppercase border-2 border-foreground">
                    Back
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

                <div className="flex items-center gap-2 justify-center pt-1">
                  <span className="text-xs text-muted-foreground">Or call us:</span>
                  <a href="tel:4129697757" className="text-xs font-heading font-black text-accent uppercase hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 412-969-7757
                  </a>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-heading font-black text-xl uppercase text-muted-foreground">Cart is empty</p>
                  <p className="text-muted-foreground text-sm mt-2">Add items from the For Sale page.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 border-2 border-foreground/20 p-3 group">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="w-16 h-16 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-black text-foreground text-sm uppercase leading-tight line-clamp-2">{item.title}</p>
                        {item.condition && <p className="text-xs text-muted-foreground mt-0.5">{item.condition}</p>}
                        <p className="font-heading font-black text-accent text-lg mt-1">${Number(item.price).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-accent transition-colors flex-shrink-0 self-start mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "cart" && cartItems.length > 0 && (
          <div className="border-t-2 border-foreground p-6 flex-shrink-0 bg-background">
            <div className="flex justify-between items-center mb-4">
              <span className="font-heading font-black text-foreground uppercase tracking-wide">Total</span>
              <span className="font-heading font-black text-accent text-3xl">${total.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => setStep("checkout")}
              className="w-full h-12 bg-accent text-white hover:bg-accent/90 font-heading font-black text-lg uppercase tracking-wide"
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}