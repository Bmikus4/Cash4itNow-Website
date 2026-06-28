import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, Upload, X, Image, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const TIME_SLOTS = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–4pm)",
  "Evening (4pm–7pm)",
  "Flexible – Any Time",
];

const ITEM_TYPES = [
  "Records & Music", "Toys & Collectibles", "Military & Weapons",
  "Jewelry", "Signs & Advertising", "Sports & Cards",
  "Furniture", "Art", "Full Estate", "Other",
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", message: "",
    preferred_date: "", preferred_time: "",
    property_address: "", item_type: "",
  });
  const [photos, setPhotos] = useState([]); // { file, previewUrl, uploading, url }
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      url: null,
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 8)); // max 8
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in Name, Phone, and description.");
      return;
    }
    setSending(true);

    // Upload photos
    const uploadedUrls = [];
    for (let i = 0; i < photos.length; i++) {
      setPhotos((prev) => prev.map((p, idx) => idx === i ? { ...p, uploading: true } : p));
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photos[i].file });
      uploadedUrls.push(file_url);
      setPhotos((prev) => prev.map((p, idx) => idx === i ? { ...p, uploading: false, url: file_url } : p));
    }

    await base44.entities.EvaluationRequest.create({
      ...form,
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
        <p><strong>Email:</strong> ${form.email || "Not provided"}</p>
        <p><strong>Property Address:</strong> ${form.property_address || "Not provided"}</p>
        <p><strong>Item Type:</strong> ${form.item_type || "Not specified"}</p>
        <p><strong>Preferred Date:</strong> ${form.preferred_date || "Flexible"}</p>
        <p><strong>Preferred Time:</strong> ${form.preferred_time || "Flexible"}</p>
        <p><strong>Description:</strong> ${form.message}</p>
        ${uploadedUrls.length > 0 ? `<p><strong>Photos:</strong> ${photoLinks}</p>` : ""}
      `,
    });

    toast.success("Request submitted! We'll be in touch soon.");
    setForm({ name: "", email: "", phone: "", message: "", preferred_date: "", preferred_time: "", property_address: "", item_type: "" });
    setPhotos([]);
    setSending(false);
  };

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
                href="tel:4129697757"
                className="flex items-center gap-4 bg-accent text-white p-6 hover:bg-accent/90 transition-colors group"
              >
                <Phone className="w-8 h-8 flex-shrink-0" />
                <div>
                  <p className="font-heading font-black text-3xl uppercase leading-none">412-969-7757</p>
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
                <p className="font-heading font-black text-background text-2xl uppercase mb-2">🇺🇸 Veteran-Owned</p>
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
                <h2 className="font-heading font-black text-foreground text-3xl uppercase tracking-tight mb-1">
                  Request an Evaluation
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Tell us what you have, pick a visit time, and attach photos. We'll confirm quickly.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Name *</Label>
                      <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-12 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="h-12 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Phone *</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your phone number" className="h-12 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                  </div>

                  {/* Property Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="property_address" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Property Address</Label>
                    <Input id="property_address" value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} placeholder="123 Main St, Pittsburgh, PA" className="h-12 border-2 border-foreground/30 bg-transparent focus:border-foreground" />
                  </div>

                  {/* Item Type */}
                  <div className="space-y-2">
                    <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Item Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {ITEM_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm({ ...form, item_type: type === form.item_type ? "" : type })}
                          className={`text-xs font-heading font-bold uppercase px-3 py-2 border-2 transition-colors ${
                            form.item_type === type
                              ? "bg-accent border-accent text-white"
                              : "border-foreground/30 text-foreground hover:border-foreground"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Date & Time */}
                  <div className="border-2 border-accent/30 bg-accent/5 p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="w-4 h-4 text-accent" />
                      <span className="font-heading font-black text-foreground text-sm uppercase tracking-widest">Schedule a Visit</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="preferred_date" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Preferred Date</Label>
                        <Input
                          id="preferred_date"
                          type="date"
                          value={form.preferred_date}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                          className="h-12 border-2 border-foreground/30 bg-background focus:border-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">Preferred Time</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setForm({ ...form, preferred_time: slot })}
                              className={`text-xs font-heading font-bold uppercase px-2 py-2 border-2 transition-colors leading-tight ${
                                form.preferred_time === slot
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

                  {/* What do you have */}
                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold">What do you have? *</Label>
                    <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe the items, collection, or estate you'd like evaluated…" rows={4} className="border-2 border-foreground/30 bg-transparent focus:border-foreground resize-none" />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-3">
                    <Label className="font-heading text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                      <Image className="w-3.5 h-3.5" /> Attach Photos of Your Collection (optional, up to 8)
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    {photos.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-foreground/30 hover:border-accent hover:bg-accent/5 transition-colors p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="font-heading font-bold text-sm uppercase tracking-wide">Click to upload photos</span>
                        <span className="text-xs">JPG, PNG, HEIC — up to 8 images</span>
                      </button>
                    )}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.map((p, i) => (
                          <div key={i} className="relative aspect-square border-2 border-foreground/20 overflow-hidden">
                            <img src={p.previewUrl} alt={`upload-${i}`} className="w-full h-full object-cover" />
                            {p.uploading && (
                              <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              </div>
                            )}
                            {!sending && (
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-1 right-1 w-5 h-5 bg-accent text-white flex items-center justify-center hover:bg-accent/80"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}