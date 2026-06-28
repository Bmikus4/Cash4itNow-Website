import React, { useState, useRef } from "react";
import { Upload, X, Plus, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  "Records & Music", "Toys & Collectibles", "Military & Weapons",
  "Jewelry", "Signs & Advertising", "Sports & Cards",
  "Home & Décor", "Furniture", "Art", "Other",
];

const CONDITIONS = ["Excellent", "Very Good", "Good", "Fair"];

const EMPTY_FORM = {
  title: "", category: "", price: "", condition: "", description: "", status: "available",
};

export default function AdminForSaleForm({ onClose, editItem = null }) {
  const [form, setForm] = useState(editItem ? {
    title: editItem.title || "",
    category: editItem.category || "",
    price: editItem.price || "",
    condition: editItem.condition || "",
    description: editItem.description || "",
    status: editItem.status || "available",
  } : EMPTY_FORM);

  const [existingPhotos, setExistingPhotos] = useState(editItem?.photo_urls || []);
  const [newPhotos, setNewPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const added = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewPhotos((prev) => [...prev, ...added].slice(0, 10 - existingPhotos.length));
    e.target.value = "";
  };

  const removeExisting = (idx) => setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
  const removeNew = (idx) => setNewPhotos((prev) => prev.filter((_, i) => i !== idx));

  const getPhotoUrls = async () => {
    const tempUrls = [];
    for (const photo of newPhotos) {
      if (photo.uploadedUrl) {
        tempUrls.push(photo.uploadedUrl);
      } else {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo.file });
        photo.uploadedUrl = file_url;
        tempUrls.push(file_url);
      }
    }
    setNewPhotos((prev) => prev.map((p) => ({ ...p })));
    return [...existingPhotos, ...tempUrls];
  };

  const generateAiTitle = async () => {
    setGeneratingTitle(true);
    const photoUrls = await getPhotoUrls();
    if (photoUrls.length === 0) { toast.error("Add photos first to generate a title."); setGeneratingTitle(false); return; }
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping write an estate sale listing. Look at these photos and identify the item. Return a concise, specific product title (4-8 words) that accurately names what the item is — include brand, material, era, or type if clearly visible. No fluff, just the item name. Category hint: "${form.category || "estate item"}"`,
      file_urls: photoUrls,
      response_json_schema: { type: "object", properties: { title: { type: "string" } } },
    });
    setForm((prev) => ({ ...prev, title: result.title }));
    setGeneratingTitle(false);
  };

  const generateAiDescription = async () => {
    setGeneratingDesc(true);
    const photoUrls = await getPhotoUrls();
    if (photoUrls.length === 0) { toast.error("Add photos first to generate a description."); setGeneratingDesc(false); return; }
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are writing a compelling estate sale item listing. Analyze these photos of the item and write a vivid, accurate, and enticing description for an estate sale shopper. Include: what the item is, notable details (materials, markings, era/age if apparent, brand if visible), condition observations, and why it's interesting or valuable. Keep it 2-4 sentences. Be specific — mention actual details visible in the photos. Category hint: "${form.category || "estate item"}". Title hint: "${form.title || "item"}"`,
      file_urls: photoUrls,
      response_json_schema: { type: "object", properties: { description: { type: "string" } } },
    });
    setForm((prev) => ({ ...prev, description: result.description }));
    setGeneratingDesc(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Title and price are required.");
      return;
    }
    setSaving(true);

    const uploadedUrls = [];
    for (const photo of newPhotos) {
      if (photo.uploadedUrl) {
        uploadedUrls.push(photo.uploadedUrl);
      } else {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo.file });
        uploadedUrls.push(file_url);
      }
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      photo_urls: [...existingPhotos, ...uploadedUrls],
    };

    if (editItem) {
      await base44.entities.ForSaleItem.update(editItem.id, payload);
      toast.success("Item updated!");
    } else {
      await base44.entities.ForSaleItem.create(payload);
      toast.success("Item added!");
    }

    queryClient.invalidateQueries({ queryKey: ["forsale-items"] });
    setSaving(false);
    onClose();
  };

  const totalPhotos = existingPhotos.length + newPhotos.length;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading font-black text-lg uppercase tracking-widest">
            {editItem ? "Edit Item" : "Add For Sale Item"}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Title *</Label>
              <button
                type="button"
                onClick={generateAiTitle}
                disabled={generatingTitle || (existingPhotos.length === 0 && newPhotos.length === 0)}
                className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-accent hover:text-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {generatingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingTitle ? "Identifying…" : "Generate with AI"}
              </button>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Item title"
              className="h-11 border-2 border-foreground/20 focus:border-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Price ($) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="h-11 border-2 border-foreground/20 focus:border-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Condition</Label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full h-11 border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 focus:outline-none focus:border-foreground"
              >
                <option value="">Select condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat === form.category ? "" : cat })}
                  className={`text-xs font-heading font-bold uppercase px-3 py-1.5 border-2 transition-colors ${
                    form.category === cat ? "bg-accent border-accent text-white" : "border-foreground/20 text-foreground hover:border-accent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">Description</Label>
              <button
                type="button"
                onClick={generateAiDescription}
                disabled={generatingDesc || (existingPhotos.length === 0 && newPhotos.length === 0)}
                className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-accent hover:text-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingDesc ? "Analyzing photos…" : "Generate with AI"}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Item description..."
              rows={3}
              className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2 focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="flex gap-3">
            {["available", "pending", "sold"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={`text-xs font-heading font-bold uppercase px-4 py-2 border-2 transition-colors ${
                  form.status === s ? "bg-foreground border-foreground text-background" : "border-foreground/20 text-foreground hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold">
              Photos ({totalPhotos}/10)
            </Label>

            {totalPhotos < 10 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-foreground/20 hover:border-accent hover:bg-accent/5 transition-colors p-5 flex items-center justify-center gap-3 text-foreground/50"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-heading font-bold text-sm uppercase tracking-wide">Click to upload photos</span>
                </button>
              </>
            )}

            {totalPhotos > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {existingPhotos.map((url, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square border border-foreground/20 overflow-hidden">
                    <img src={url} alt={`photo-${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExisting(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-accent text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {newPhotos.map((p, i) => (
                  <div key={`new-${i}`} className="relative aspect-square border border-foreground/20 overflow-hidden">
                    <img src={p.previewUrl} alt={`new-${i}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-accent/80 text-white text-center text-xs py-0.5 font-heading font-bold">NEW</div>
                    <button type="button" onClick={() => removeNew(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-accent text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1 h-12 bg-accent text-white hover:bg-accent/90 font-heading font-black uppercase tracking-wide">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {newPhotos.length > 0 ? "Uploading photos…" : "Saving…"}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editItem ? "Save Changes" : "Add Item"}
                </span>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-12 border-2 border-foreground/20 font-heading font-black uppercase">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}