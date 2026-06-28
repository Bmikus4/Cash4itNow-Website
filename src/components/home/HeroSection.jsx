import React from "react";
import { motion } from "framer-motion";
import { Phone, ArrowDown } from "lucide-react";

// Original flyer uploaded by user
const ORIGINAL_FLYER = "https://media.base44.com/images/public/user_69ff81ce6a255b9a16af7298/14dc69cc4_Screenshot_20260524_215817_Facebook.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-foreground pt-16">
      {/* Split: left = text, right = original flyer collage */}
      <div className="absolute inset-0 flex">
        <div className="w-full md:w-1/2 bg-foreground" />
        <div className="hidden md:block w-1/2 relative overflow-hidden">
          <img
            src={ORIGINAL_FLYER}
            alt="Cash 4 It Now collectibles"
            className="w-full h-full object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/40 to-transparent" />
        </div>
      </div>

      {/* Mobile background */}
      <div className="absolute inset-0 md:hidden">
        <img src={ORIGINAL_FLYER} alt="Cash 4 It Now collectibles" className="w-full h-full object-cover object-top opacity-20" />
      </div>

      {/* Red corner accent */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[120px] border-t-accent border-l-[120px] border-l-transparent opacity-90 hidden md:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full py-16 md:py-24">
        <div className="max-w-2xl">
          {/* Veteran badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 mb-8"
          >
            <span className="text-sm font-bold uppercase tracking-widest font-heading">🇺🇸 Veteran-Owned Business</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-heading font-black text-background text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-tight mb-4"
          >
            Cash 4 It Now
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading font-bold text-accent text-2xl md:text-3xl uppercase tracking-wide mb-5"
          >
            Estate Liquidators
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full h-1 bg-accent mb-5"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="font-heading font-bold text-background text-lg md:text-xl uppercase tracking-wide mb-2"
          >
            Full Estate Services
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-background/70 text-base md:text-lg leading-relaxed mb-10 max-w-lg"
          >
            A complete estate service from evaluating the assets, conducting the sale, to getting the home and property ready for sale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="tel:4129697757"
              className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 font-heading font-black text-xl md:text-2xl uppercase tracking-wider hover:bg-accent/90 transition-colors"
            >
              <Phone className="w-6 h-6" />
              412-969-7757
            </a>
            <a
              href="#what-we-buy"
              className="inline-flex items-center justify-center gap-2 border-2 border-background text-background px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-background/10 transition-colors"
            >
              What We Buy
              <ArrowDown className="w-5 h-5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4"
          >
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
            >
              How We Get It Done
              <ArrowDown className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="w-6 h-6 text-background/40" />
      </motion.div>
    </section>
  );
}