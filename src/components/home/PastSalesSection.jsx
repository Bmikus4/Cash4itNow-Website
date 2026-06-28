import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { CalendarCheck, DollarSign, MapPin, Plus, X, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";

// ─── Admin Form ────────────────────────────────────────────────────────────────
function AdminPastSaleForm({ onClose, onSaved, editSale = null }) {
  const [form, setForm] = useState({
    title: editSale?.title || "",
    date: editSale?.date || "",
    location: editSale?.location || "",
    description: editSale?.description || "",
    gross_sales: editSale?.gross_sales || "",
    highlight_tags: editSale?.highlight_tags?.join(", ") || "",
  });
  const [existingPhotos, setExistingPhotos] = useState(editSale?.photo_urls || []);
  const [newPhotos, setNewPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos((p) => [...p, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const uploadedUrls = [];
    for (const p of newPhotos) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: p.file });
      uploadedUrls.push(file_url);
    }
    const tags = form.highlight_tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...form,
      gross_sales: form.gross_sales ? parseFloat(form.gross_sales) : undefined,
      highlight_tags: tags,
      photo_urls: [...existingPhotos, ...uploadedUrls],
    };
    if (editSale) {
      await base44.entities.PastSale.update(editSale.id, payload);
    } else {
      await base44.entities.PastSale.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading font-black text-lg uppercase tracking-widest">
            {editSale ? "Edit Past Sale" : "Add Past Sale"}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2.5 focus:outline-none focus:border-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2.5 focus:outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Pittsburgh, PA"
                className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2.5 focus:outline-none focus:border-foreground" />
            </div>
          </div>
          <div>
            <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Gross Sales ($)</label>
            <input type="number" min="0" step="0.01" value={form.gross_sales} onChange={(e) => setForm({ ...form, gross_sales: e.target.value })} placeholder="0.00"
              className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2.5 focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2 focus:outline-none focus:border-foreground resize-none" />
          </div>
          <div>
            <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-1">Highlight Tags (comma-separated)</label>
            <input value={form.highlight_tags} onChange={(e) => setForm({ ...form, highlight_tags: e.target.value })} placeholder="Vintage Records, Jewelry, Military Medals"
              className="w-full border-2 border-foreground/20 bg-background text-foreground font-body text-sm px-3 py-2.5 focus:outline-none focus:border-foreground" />
          </div>
          {/* Photos */}
          <div>
            <label className="font-heading text-xs uppercase tracking-widest text-foreground/60 font-bold block mb-2">Photos</label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-foreground/20 hover:border-accent p-4 flex items-center justify-center gap-2 text-foreground/50 text-sm font-heading font-bold uppercase">
              <Upload className="w-4 h-4" /> Add Photos
            </button>
            {(existingPhotos.length > 0 || newPhotos.length > 0) && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {existingPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setExistingPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-accent text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {newPhotos.map((p, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={p.preview} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-accent text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 h-11 bg-accent text-white font-heading font-black uppercase tracking-wide text-sm flex items-center justify-center gap-2 hover:bg-accent/90">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>{editSale ? "Save Changes" : "Add Past Sale"}</>}
            </button>
            <button type="button" onClick={onClose}
              className="h-11 px-5 border-2 border-foreground/20 font-heading font-black uppercase text-sm hover:border-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function PastSalesSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { photos, idx }
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["past-sales"],
    queryFn: () => base44.entities.PastSale.list("-date", 50),
  });

  if (isLoading || (sales.length === 0 && !isAdmin)) return null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["past-sales"] });
    setShowForm(false);
    setEditSale(null);
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Proven Results</p>
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-foreground leading-[0.9] mb-2">
            Past Sales
          </h2>
          <div className="h-1.5 bg-accent w-24 mt-3 mb-4" />
          <p className="text-muted-foreground max-w-xl">
            See what we've accomplished for our clients — successful estate liquidations throughout the Pittsburgh area.
          </p>
        </motion.div>

        {isAdmin && (
          <div className="mb-8">
            <button onClick={() => { setEditSale(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 bg-accent text-white font-heading font-black text-sm uppercase tracking-widest px-5 py-3 hover:bg-accent/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Past Sale
            </button>
          </div>
        )}

        {sales.length === 0 && isAdmin && (
          <p className="text-muted-foreground font-heading text-sm uppercase tracking-widest">No past sales yet. Add one above.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sales.map((sale, i) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="border-2 border-foreground/10 bg-card flex flex-col group"
            >
              {/* Photo grid */}
              {sale.photo_urls?.length > 0 && (
                <div
                  className="grid gap-0.5 overflow-hidden cursor-pointer"
                  style={{ gridTemplateColumns: sale.photo_urls.length === 1 ? "1fr" : "1fr 1fr" }}
                  onClick={() => setLightbox({ photos: sale.photo_urls, idx: 0 })}
                >
                  {sale.photo_urls.slice(0, 4).map((url, pi) => (
                    <div key={pi} className={`relative overflow-hidden ${sale.photo_urls.length === 1 ? "h-52" : "h-28"}`}>
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {pi === 3 && sale.photo_urls.length > 4 && (
                        <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                          <span className="text-background font-heading font-black text-xl">+{sale.photo_urls.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6 flex flex-col flex-1 gap-3">
                {/* Date & location */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-heading font-bold uppercase tracking-wider text-accent">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {format(new Date(sale.date), "MMM d, yyyy")}
                  </span>
                  {sale.location && (
                    <span className="flex items-center gap-1.5 font-heading font-bold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {sale.location}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-black text-foreground text-xl uppercase tracking-tight leading-tight">
                  {sale.title}
                </h3>

                {sale.gross_sales > 0 && (
                  <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 w-fit">
                    <DollarSign className="w-3.5 h-3.5 text-accent" />
                    <span className="font-heading font-black text-accent text-sm uppercase tracking-wider">
                      ${sale.gross_sales.toLocaleString()} Grossed
                    </span>
                  </div>
                )}

                {sale.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">{sale.description}</p>
                )}

                {sale.highlight_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {sale.highlight_tags.map((tag, ti) => (
                      <span key={ti} className="font-heading font-bold text-xs uppercase tracking-wider px-2 py-0.5 border border-foreground/20 text-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isAdmin && (
                  <button
                    onClick={() => { setEditSale(sale); setShowForm(true); }}
                    className="mt-2 text-xs font-heading font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.idx]} className="w-full max-h-[80vh] object-contain" />
            <div className="absolute top-2 right-2 flex gap-2">
              {lightbox.photos.length > 1 && (
                <span className="bg-foreground/60 text-background font-heading text-xs px-2 py-1">
                  {lightbox.idx + 1} / {lightbox.photos.length}
                </span>
              )}
              <button onClick={() => setLightbox(null)} className="bg-accent text-white p-1"><X className="w-4 h-4" /></button>
            </div>
            {lightbox.photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {lightbox.photos.map((url, i) => (
                  <img key={i} src={url} onClick={() => setLightbox((l) => ({ ...l, idx: i }))}
                    className={`h-12 w-16 object-cover cursor-pointer border-2 ${i === lightbox.idx ? "border-accent" : "border-transparent opacity-60"}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <AdminPastSaleForm
          editSale={editSale}
          onClose={() => { setShowForm(false); setEditSale(null); }}
          onSaved={refresh}
        />
      )}
    </section>
  );
}