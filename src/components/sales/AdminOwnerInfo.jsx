import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Phone, Mail, MapPin, Pencil, Loader2, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AdminOwnerInfo({ sale }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    owner_name: sale.owner_name || "",
    owner_phone: sale.owner_phone || "",
    owner_email: sale.owner_email || "",
    owner_address: sale.owner_address || "",
    owner_notes: sale.owner_notes || "",
  });

  const hasInfo = sale.owner_name || sale.owner_phone || sale.owner_email || sale.owner_address;

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.UpcomingSale.update(sale.id, form);
    setSaving(false);
    setEditing(false);
    toast.success("Owner info saved");
    queryClient.invalidateQueries({ queryKey: ["upcoming-sales"] });
  };

  if (editing) {
    return (
      <div className="mt-4 border-2 border-accent/50 bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-heading font-black text-foreground text-xs uppercase tracking-wider">Owner Contact Info</p>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Owner name" className="w-full h-9 border border-foreground/20 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
        <input value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} placeholder="Phone" className="w-full h-9 border border-foreground/20 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
        <input value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} placeholder="Email" className="w-full h-9 border border-foreground/20 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
        <input value={form.owner_address} onChange={(e) => setForm({ ...form, owner_address: e.target.value })} placeholder="Address" className="w-full h-9 border border-foreground/20 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
        <textarea value={form.owner_notes} onChange={(e) => setForm({ ...form, owner_notes: e.target.value })} placeholder="Notes" rows={2} className="w-full border border-foreground/20 px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent" />
        <button onClick={handleSave} disabled={saving} className="w-full bg-accent text-white font-heading font-black text-xs uppercase tracking-wider h-9 hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-2 border-accent/30 bg-accent/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-heading font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-accent" /> Owner Info
        </p>
        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-accent"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
      {hasInfo ? (
        <div className="space-y-1.5">
          {sale.owner_name && <p className="text-foreground text-sm font-medium">{sale.owner_name}</p>}
          {sale.owner_phone && (
            <a href={`tel:${sale.owner_phone}`} className="flex items-center gap-2 text-muted-foreground text-xs hover:text-accent transition-colors">
              <Phone className="w-3 h-3" /> {sale.owner_phone}
            </a>
          )}
          {sale.owner_email && (
            <a href={`mailto:${sale.owner_email}`} className="flex items-center gap-2 text-muted-foreground text-xs hover:text-accent transition-colors break-all">
              <Mail className="w-3 h-3 flex-shrink-0" /> {sale.owner_email}
            </a>
          )}
          {sale.owner_address && (
            <p className="flex items-start gap-2 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /> {sale.owner_address}
            </p>
          )}
          {sale.owner_notes && <p className="text-muted-foreground/70 text-xs italic pt-1 border-t border-foreground/10">{sale.owner_notes}</p>}
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-muted-foreground text-xs hover:text-accent transition-colors">+ Add owner contact info</button>
      )}
    </div>
  );
}