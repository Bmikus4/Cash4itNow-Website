import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Calendar, Search, X, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchInventory, INVENTORY_QUERY_KEY } from "@/api/inventoryClient";
import ForSaleItemCard from "@/components/forsale/ForSaleItemCard";
import CartDrawer from "@/components/forsale/CartDrawer";
import { useCart } from "@/lib/CartContext";
import { COMMERCE_ENABLED } from "@/lib/flags";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, breadcrumbGraph } from "@/lib/structuredData";

export default function ForSale() {
  usePageMeta({
    title: "Antiques & Collectibles For Sale",
    description:
      "Antiques, collectibles and estate finds available now from Cash 4 It Now in Pittsburgh, PA. Tell us what you collect and we call when it turns up.",
  });
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: "For Sale", path: "/for-sale" },
    ])
  );
  const [showCart, setShowCart] = useState(false);
  const [filterStatus, setFilterStatus] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const { count, addToCart } = useCart();

  const { data: items = [], isLoading } = useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: fetchInventory,
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

  const handleBuyNow = (item) => {
    addToCart(item);
    setShowCart(true);
  };

  // Filters and a search box over nothing are furniture: they imply an
  // inventory the visitor is failing to find. They appear once there is stock.
  const hasInventory = items.length > 0;

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
              {COMMERCE_ENABLED && (
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
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter tabs */}
      {hasInventory && (
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
      )}

      {/* Search bar */}
      {hasInventory && (
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
      )}

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
            hasInventory ? (
              <div className="text-center py-24">
                <p className="font-heading font-black text-3xl uppercase text-muted-foreground">No items found</p>
                <p className="text-muted-foreground mt-2">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="border-2 border-foreground max-w-3xl mx-auto my-8 p-8 md:p-12 text-center">
                <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Between Sales</p>
                <h2 className="font-heading font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-4">
                  Nothing listed right now
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                  Inventory goes up as estates come in, and the best pieces move at the sales themselves. Tell us
                  what you collect and we'll call you when it turns up.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="tel:4129697757"
                    className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 font-heading font-black text-lg uppercase tracking-wider hover:bg-accent/90 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    412-969-7757
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 border-2 border-foreground px-6 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors"
                  >
                    Tell Us What You Want
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item, i) => (
                <ForSaleItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {COMMERCE_ENABLED && showCart && <CartDrawer onClose={() => setShowCart(false)} />}
    </div>
  );
}