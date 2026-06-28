import React from "react";
import { motion } from "framer-motion";
import { Phone, ArrowDown } from "lucide-react";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-foreground pt-16">
      {/* Left: headline + CTAs */}
      <div className="relative z-10 flex items-center w-full md:w-1/2 px-6 md:px-10 py-16 md:py-24">
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

      {/* Right: before / after estate cleanout slider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative w-full md:w-1/2 h-[55vh] md:h-auto md:min-h-screen"
      >
        <BeforeAfterSlider
          beforeSrc="/hero-before.webp"
          afterSrc="/hero-after.webp"
          beforeLabel="Before"
          afterLabel="After"
          className="absolute inset-0 w-full h-full"
        />
        {/* Blend the slider into the dark column on desktop */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-foreground to-transparent pointer-events-none" />
        {/* Red corner accent */}
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[120px] border-t-accent border-l-[120px] border-l-transparent opacity-90 hidden md:block pointer-events-none" />
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="w-6 h-6 text-background/40" />
      </motion.div>
    </section>
  );
}