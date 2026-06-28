import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Pencil, Trash2, CheckSquare, Calendar, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ForSaleItemCard from "@/components/forsale/ForSaleItemCard";
import CartDrawer from "@/components/forsale/CartDrawer";
import AdminForSaleForm from "@/components/forsale/AdminForSaleForm";
import { useCart } from "@/lib/CartContext";

export default function ForSale() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showCart, setShowCart] = useState(false);
  const [filterStatus, setFilterStatus] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const { count, addToCart } = useCart();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["forsale-items"],
    queryFn: () => base44.entities.ForSaleItem.list("-created_date", 100),
  });

  const q = searchQuery.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const statusOk = filterStatus === "all" ? true : item.status === filterStatus;
    if (!statusOk) return false;
    if (!q) return true;
    const title = (item.title || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const description = (item.description || "").toLowerCase();
    return title.includes(q) || category.includes(q) || description.includes(q);
  });

  const handleMarkSold = async (e, item) => {
    e.stopPropagation();
    await base44.entities.ForSaleItem.update(item.id, { status: "sold" });
    queryClient.invalidateQueries({ queryKey: ["forsale-items"] });
  };

  const handleDelete = async (e, item) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    await base44.entities.ForSaleItem.delete(item.id);
    queryClient.invalidateQueries({ queryKey: ["forsale-items"] });
  };

  const handleBuyNow = (item) => {
    addToCart(item);
    setShowCart(true);
  };

  return (
    <div className="pt-16 bg-background min-h-screen">
      {/* Header */}
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Cash 4 It Now</p>
              <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
                For Sale
              </h1>
              <div className="h-1.5 bg-accent w-24 mb-4" />
              <p className="text-background/70 text-lg max-w-xl">
                Browse our current inventory of collectibles, antiques, and estate finds.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 text-accent font-heading font-black text-sm uppercase tracking-widest hover:text-background transition-colors"
              >
                <Calendar className="w-4 h-4" />
                View Upcoming Sales
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 mt-2">
              {isAdmin && (
                <button
                  onClick={() => { setEditItem(null); setShowAdminForm(true); }}
                  className="flex items-center gap-2 bg-background text-foreground font-heading font-black text-sm uppercase tracking-wider px-5 py-3 hover:bg-background/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-2 bg-accent text-white font-heading font-black text-sm uppercase tracking-wider px-5 py-3 hover:bg-accent/90 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Cart
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-accent font-black text-xs flex items-center justify-center rounded-full">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="border-b-2 border-foreground bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex gap-0">
          {[
            { label: "Available", value: "available" },
            { label: "All Items", value: "all" },
            { label: "Sold", value: "sold" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`font-heading font-black text-sm uppercase tracking-widest px-6 py-4 border-b-4 transition-colors ${
                filterStatus === tab.value
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-background py-6 px-6 md:px-10 border-b border-foreground/10">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or keyword..."
              className="w-full border-2 border-foreground/20 bg-background pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items grid */}
      <section className="py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-2 border-foreground/10 animate-pulse">
                  <div className="bg-muted aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-heading font-black text-3xl uppercase text-muted-foreground">No items found</p>
              <p className="text-muted-foreground mt-2">Check back soon — new items added regularly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item, i) => (
                <div key={item.id} className="relative group">
                  <ForSaleItemCard
                    item={item}
                    index={i}
                    onBuyNow={handleBuyNow}
                  />
                  {isAdmin && (
                    <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditItem(item); setShowAdminForm(true); }}
                        className="bg-foreground text-background p-1.5 hover:bg-accent transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {item.status !== "sold" && (
                        <button
                          onClick={(e) => handleMarkSold(e, item)}
                          className="bg-green-700 text-white p-1.5 hover:bg-green-800 transition-colors"
                          title="Mark as Sold"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, item)}
                        className="bg-destructive text-white p-1.5 hover:bg-destructive/80 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}

      {showAdminForm && (
        <AdminForSaleForm
          editItem={editItem}
          onClose={() => { setShowAdminForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}