import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MetalPriceTicker from "@/components/home/MetalPriceTicker";
import JewelryPayoutCalculator from "@/components/home/JewelryPayoutCalculator";

const JEWELRY_IMG = "/img/f3522ea84_generated_image.webp";

const items = [
  "Diamond Rings & Engagement Rings",
  "Gold & Silver Chains",
  "Vintage Brooches & Pins",
  "Pearls & Strands",
  "Turquoise & Native American Jewelry",
  "Rhinestone Costume Jewelry",
  "Signed Pieces — Weiss, Trifari, Miriam Haskell",
  "Estate Necklaces & Earrings",
  "Watches — Rolex, Omega, Bulova",
  "Platinum & White Gold",
  "Gemstone Rings — Ruby, Sapphire, Emerald",
  "Victorian & Art Deco Pieces",
];

export default function JewelrySection() {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: "Fetch the current live spot prices for gold, silver, and platinum per troy ounce in USD. Return ONLY the JSON with no commentary.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              gold_per_oz: { type: "number", description: "Gold spot price per troy ounce in USD" },
              silver_per_oz: { type: "number", description: "Silver spot price per troy ounce in USD" },
              platinum_per_oz: { type: "number", description: "Platinum spot price per troy ounce in USD" },
            },
          },
        });
        setPrices(result);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to fetch metal prices", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="border border-foreground flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-2/5 overflow-hidden">
            <img
              src={JEWELRY_IMG}
              alt="Estate jewelry collection"
              className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Content */}
          <div className="w-full md:w-3/5 p-8 md:p-14 flex flex-col justify-center border-t md:border-t-0 md:border-l border-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block bg-accent text-white font-heading font-black text-xs uppercase tracking-widest px-3 py-1 mb-5">
                Estate Jewelry Liquidation
              </span>
              <h2 className="font-heading font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.9] mb-3">
                We Pay Up to 95%<br />of Spot Price for Fine &amp; Vintage Jewelry
              </h2>
              <div className="h-1.5 bg-accent w-20 mb-6" />
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
                Whether it's a single heirloom piece or an entire jewelry box, we evaluate every item on the spot and pay cash immediately. No consignment, no waiting — just a fair offer from someone who knows the value.
              </p>

              <MetalPriceTicker prices={prices} loading={loading} lastUpdated={lastUpdated} />

              <JewelryPayoutCalculator prices={prices} />

              <div className="flex flex-wrap gap-2 mb-10">
                {items.map((item) => (
                  <span
                    key={item}
                    className="font-heading text-xs uppercase tracking-wider border-2 border-foreground px-3 py-1.5 text-foreground font-bold hover:bg-foreground hover:text-background transition-colors"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <a
                href="tel:4129697757"
                className="inline-flex items-center gap-3 bg-accent text-white px-8 py-4 font-heading font-black text-xl uppercase hover:bg-accent/90 transition-colors w-fit"
              >
                <Phone className="w-5 h-5" />
                Get a Free Evaluation
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}