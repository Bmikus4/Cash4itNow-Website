import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useFavorites } from "@/lib/FavoritesContext";
import ForSaleItemCard from "@/components/forsale/ForSaleItemCard";

export default function Favorites() {
  const { favorites } = useFavorites();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["forsale-items"],
    queryFn: () => base44.entities.ForSaleItem.list("-created_date", 200),
  });

  const favoriteItems = items.filter((item) => favorites.includes(item.id));

  return (
    <div className="pt-16 bg-background min-h-screen">
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Cash 4 It Now</p>
            <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
              Saved Items
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-4" />
            <p className="text-background/70 text-lg max-w-xl">
              Items you've favorited — ready when you are.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
          ) : favoriteItems.length === 0 ? (
            <div className="text-center py-24">
              <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-heading font-black text-3xl uppercase text-muted-foreground">No saved items yet</p>
              <p className="text-muted-foreground mt-2">Browse items and tap the heart to save them here.</p>
              <Link
                to="/for-sale"
                className="mt-6 inline-block bg-accent text-white font-heading font-black text-sm uppercase tracking-widest px-6 py-3 hover:bg-accent/90 transition-colors"
              >
                Browse For Sale
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteItems.map((item, i) => (
                <ForSaleItemCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}