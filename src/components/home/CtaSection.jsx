import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, Send, Upload, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const ITEM_TYPES = [
  "Records & Music", "Toys & Collectibles", "Military & Weapons",
  "Jewelry", "Signs & Advertising", "Sports & Cards",
  "Furniture", "Art", "Full Estate", "Other",
];

export default function CtaSection() {
  const [form, setForm] = useState({ name: "", phone: "", property_address: "", item_type: "" });
  const [photos, setPhotos] = useState([]);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
    e.target.value = "";
  };

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please provide your name and phone number.");
      return;
    }
    setSending(true);

    const uploadedUrls = [];
    for (const photo of photos) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo.file });
      uploadedUrls.push(file_url);
    }

    await base44.entities.EvaluationRequest.create({
      name: form.name,
      phone: form.phone,
      message: `Property Address: ${form.property_address || "Not provided"}\nItem Type: ${form.item_type || "Not specified"}`,
      photo_urls: uploadedUrls,
    });

    const photoLinks = uploadedUrls.map((url, i) => `<a href="${url}">Photo ${i + 1}</a>`).join(" | ");
    await base44.integrations.Core.SendEmail({
      to: "info@cash4itnow.com",
      subject: `New Evaluation Request from ${form.name}`,
      body: `
        <h2>New Evaluation Request</h2>
        <p><strong>Name:</strong> ${form.name}</p>
        <p><strong>Phone:</strong> ${form.phone}</p>
        <p><strong>Property Address:</strong> ${form.property_address || "Not provided"}</p>
        <p><strong>Item Type:</strong> ${form.item_type || "Not specified"}</p>
        ${uploadedUrls.length > 0 ? `<p><strong>Photos:</strong> ${photoLinks}</p>` : ""}
      `,
    });

    setSending(false);
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

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">
                Upload Photos (optional, up to 6)
              </Label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-foreground/20 hover:border-accent hover:bg-accent/5 transition-colors p-5 flex items-center justify-center gap-3 text-foreground/50"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-heading font-bold text-sm uppercase tracking-wide">Click to upload photos</span>
                </button>
              )}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square border border-foreground/20 overflow-hidden">
                      <img src={p.previewUrl} alt={`upload-${i}`} className="w-full h-full object-cover" />
                      {!sending && (
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-accent text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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