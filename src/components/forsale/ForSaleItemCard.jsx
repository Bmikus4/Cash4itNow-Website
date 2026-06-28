import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, CheckCircle2, Heart, Handshake } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import MakeOfferModal from "@/components/forsale/MakeOfferModal";

const conditionColors = {
  Excellent: "bg-green-100 text-green-800",
  "Very Good": "bg-blue-100 text-blue-800",
  Good: "bg-yellow-100 text-yellow-800",
  Fair: "bg-orange-100 text-orange-800",
};

export default function ForSaleItemCard({ item, index, onBuyNow }) {
  const { addToCart, cartItems } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showOffer, setShowOffer] = useState(false);
  const isSold = item.status === "sold";
  const isPending = item.status === "pending";
  const inCart = cartItems.some((i) => i.id === item.id);
  const mainPhoto = item.photo_urls?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border-2 border-foreground flex flex-col group hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {(isSold || isPending) && (
          <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center">
            <span className="font-heading font-black text-2xl uppercase text-white tracking-widest rotate-[-15deg] border-4 border-white px-4 py-1">
              {isSold ? "Sold" : "Pending"}
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-background/80 hover:bg-background transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite(item.id) ? "fill-accent text-accent" : "text-foreground/60"}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading font-black text-foreground text-base uppercase tracking-tight leading-tight flex-1">
            {item.title}
          </h3>
        </div>

        {item.condition && (
          <span className={`text-xs font-bold uppercase px-2 py-0.5 w-fit mb-2 ${conditionColors[item.condition] || "bg-muted text-muted-foreground"}`}>
            {item.condition}
          </span>
        )}

        {item.description && (
          <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-foreground/20">
          <span className="font-heading font-black text-accent text-2xl">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {!isSold && !isPending && (
          <>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => addToCart(item)}
                disabled={inCart}
                className={`flex-1 flex items-center justify-center gap-2 font-heading font-black text-xs uppercase tracking-wider px-3 py-2.5 transition-colors ${
                  inCart
                    ? "bg-green-600 text-white cursor-default"
                    : "bg-foreground text-background hover:bg-accent"
                }`}
              >
                {inCart ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                {inCart ? "Added" : "Add to Cart"}
              </button>
              <button
                onClick={() => (onBuyNow ? onBuyNow(item) : addToCart(item))}
                className="flex-1 flex items-center justify-center gap-2 font-heading font-black text-xs uppercase tracking-wider px-3 py-2.5 bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                Buy Now
              </button>
            </div>
            <button
              onClick={() => setShowOffer(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 font-heading font-black text-xs uppercase tracking-wider px-3 py-2.5 border-2 border-foreground/30 text-foreground/70 hover:border-accent hover:text-accent transition-colors"
            >
              <Handshake className="w-3.5 h-3.5" /> Make an Offer
            </button>
          </>
        )}
      </div>

      {showOffer && <MakeOfferModal item={item} onClose={() => setShowOffer(false)} />}
    </motion.div>
  );
}