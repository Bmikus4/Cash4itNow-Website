import React, { useState, useRef } from "react";
import { X, Plus, Upload, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const DEFAULT_ROOMS = ["Living Room", "Bedroom", "Kitchen", "Basement", "Garage", "Dining Room", "Other"];

export default function AdminSaleForm({ sale, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: sale?.title || "",
    date: sale?.date || "",
    time: sale?.time || "",
    description: sale?.description || "",
    address: sale?.address || "",
  });
  const [rooms, setRooms] = useState(sale?.rooms || []);
  const [saving, setSaving] = useState(false);
  const [uploadingRoom, setUploadingRoom] = useState(null);
  const fileInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const [pendingRoomIdx, setPendingRoomIdx] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const uploadFilesSequential = async (files, onProgress) => {
    const urls = [];
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
        urls.push(file_url);
      } catch (err) {
        failed++;
      }
      if (onProgress) onProgress(i + 1);
    }
    return { urls, failed };
  };

  const addRoom = (name) => {
    setRooms((prev) => [...prev, { room_name: name, photo_urls: [] }]);
  };

  const removeRoom = (idx) => {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRoomName = (idx, name) => {
    setRooms((prev) => prev.map((r, i) => i === idx ? { ...r, room_name: name } : r));
  };

  const triggerUpload = (roomIdx) => {
    setPendingRoomIdx(roomIdx);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || pendingRoomIdx === null) return;
    e.target.value = "";
    setUploadingRoom(pendingRoomIdx);
    const { urls } = await uploadFilesSequential(files);
    if (urls.length) {
      setRooms((prev) =>
        prev.map((r, i) =>
          i === pendingRoomIdx ? { ...r, photo_urls: [...(r.photo_urls || []), ...urls] } : r
        )
      );
    }
    setUploadingRoom(null);
    setPendingRoomIdx(null);
  };

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    setBulkUploading(true);
    setBulkProgress({ done: 0, total: files.length });
    const { urls, failed } = await uploadFilesSequential(files, (done) =>
      setBulkProgress({ done, total: files.length })
    );
    if (urls.length) {
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.room_name === "All Photos");
        if (idx >= 0) {
          return prev.map((r, i) => i === idx ? { ...r, photo_urls: [...(r.photo_urls || []), ...urls] } : r);
        }
        return [...prev, { room_name: "All Photos", photo_urls: urls }];
      });
    }
    setBulkUploading(false);
    setBulkProgress({ done: 0, total: 0 });
    if (failed) toast.error(`${failed} photo(s) failed to upload. Try again for those.`);
  };

  const removePhoto = (roomIdx, photoIdx) => {
    setRooms((prev) =>
      prev.map((r, i) =>
        i === roomIdx ? { ...r, photo_urls: r.photo_urls.filter((_, j) => j !== photoIdx) } : r
      )
    );
  };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error("Title and date are required."); return; }
    setSaving(true);
    const data = { ...form, rooms };
    if (sale?.id) {
      await base44.entities.UpcomingSale.update(sale.id, data);
    } else {
      await base44.entities.UpcomingSale.create(data);
    }
    setSaving(false);
    toast.success("Sale saved!");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-background w-full max-w-2xl border-2 border-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-foreground">
          <h2 className="font-heading font-black text-background text-lg uppercase tracking-widest">
            {sale?.id ? "Edit Sale" : "New Sale"}
          </h2>
          <button onClick={onClose} className="text-background/60 hover:text-background"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase tracking-widest">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summer Estate Sale" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase tracking-widest">Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase tracking-widest">Time</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-heading text-xs uppercase tracking-widest">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Pittsburgh, PA 15201" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-heading text-xs uppercase tracking-widest">Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the highlights of this sale..."
              className="w-full border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Bulk Photo Upload */}
          <div>
            <Label className="font-heading text-xs uppercase tracking-widest mb-2 block">Bulk Photos</Label>
            <button
              type="button"
              onClick={() => bulkInputRef.current?.click()}
              disabled={bulkUploading}
              className="w-full border-2 border-dashed border-foreground/20 hover:border-accent p-6 flex flex-col items-center justify-center gap-2 text-foreground/50 hover:text-accent transition-colors disabled:opacity-60"
            >
              {bulkUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span className="font-heading font-bold text-xs uppercase tracking-wider">
                {bulkUploading ? `Uploading ${bulkProgress.done}/${bulkProgress.total}...` : "Upload Many Photos at Once"}
              </span>
              <span className="text-xs">{bulkUploading ? "Please wait..." : "Added to an \"All Photos\" section"}</span>
            </button>
            <input ref={bulkInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBulkUpload} />
          </div>

          {/* Room Sections */}
          <div>
            <Label className="font-heading text-xs uppercase tracking-widest mb-3 block">Room Photo Sections</Label>

            {/* Add room quick picks */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DEFAULT_ROOMS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addRoom(name)}
                  className="text-xs font-heading font-bold uppercase px-3 py-1.5 border-2 border-foreground/20 hover:border-accent hover:text-accent transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {rooms.map((room, roomIdx) => (
                <div key={roomIdx} className="border border-foreground/20 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Input
                      value={room.room_name}
                      onChange={(e) => updateRoomName(roomIdx, e.target.value)}
                      className="font-heading font-bold uppercase text-sm h-9 flex-1"
                      placeholder="Room name"
                    />
                    <button onClick={() => removeRoom(roomIdx)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Photo grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {(room.photo_urls || []).map((url, pIdx) => (
                      <div key={pIdx} className="relative aspect-square overflow-hidden border border-foreground/10">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(roomIdx, pIdx)}
                          className="absolute top-0.5 right-0.5 bg-accent text-white w-5 h-5 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => triggerUpload(roomIdx)}
                      disabled={uploadingRoom === roomIdx}
                      className="aspect-square border-2 border-dashed border-foreground/20 hover:border-accent flex items-center justify-center text-foreground/40 hover:text-accent transition-colors"
                    >
                      {uploadingRoom === roomIdx ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-white hover:bg-accent/90 font-heading font-black uppercase tracking-wide"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Sale"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}