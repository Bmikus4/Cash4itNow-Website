import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowDown, ChevronRight } from "lucide-react";
import HeroLeadForm from "@/components/home/HeroLeadForm";
import DiagonalMarqueeCarousel from "@/components/ui/great-ui-diagonal-marquee-carousel";

/**
 * THE BEFORE/AFTER SLIDER IS GONE, on Ben's call 2026-09-03: "completely remove
 * the hero image from the website". What replaced it is a diagonal marquee of
 * real inventory running behind the type.
 *
 * The parallax that used to live here was translation-only for a specific
 * reason: the slider mapped drag position through getBoundingClientRect, and a
 * rotate or scale on any ancestor distorted that rect so the handle drifted from
 * the pointer. That constraint died with the slider, which is why the marquee is
 * free to rotate.
 *
 * BeforeAfterSlider.jsx STAYS. It is not dead — /for-professionals renders its
 * own before/after there, and deleting the component to tidy up after this
 * change would break that page.
 *
 * NEITHER hero-before.webp NOR hero-after.webp APPEARS BELOW, deliberately.
 * Dropping the slider and then dealing one of its two photographs back into the
 * marquee would put the removed image back on the same screen it was removed
 * from, which is not what "completely remove the hero image" means.
 *
 * THE PHOTOGRAPHS ARE THE BUSINESS'S OWN, not stock. The brief suggested
 * Unsplash; landscapes and forests would be actively wrong on an estate
 * liquidation page, where the entire claim being made is "this is the kind of
 * thing we buy and sell". Every file below is already in /public/img and is the
 * same photograph the matching category uses on /categories, so the hero shows
 * real inventory and costs no new bytes.
 */
const HERO_CARDS = [
  { id: "toys", url: "/img/3065f1e9c_generated_image.webp", title: "Vintage Tonka, Matchbox and Atari" },
  { id: "griswold", url: "/img/96588d74a_generated_image.webp", title: "Griswold cast iron" },
  { id: "jewelry", url: "/img/f3522ea84_generated_image.webp", title: "Fine and costume jewelry" },
  { id: "uranium", url: "/img/2f04db7ab_generated_image.webp", title: "Uranium glass collection" },
  { id: "cards", url: "/img/b72c0acb4_generated_image.webp", title: "Old baseball cards" },
  { id: "decor", url: "/img/2ac325373_generated_image.webp", title: "Home and decor" },
  { id: "pipes", url: "/img/ac93609f7_generated_image.webp", title: "Vintage smoking pipes" },
  { id: "pens", url: "/img/63ce2e7e9_generated_image.webp", title: "Vintage fountain pens" },
  { id: "uv", url: "/img/0bf12dc53_generated_image.webp", title: "Uranium glass under UV" },
];

export default function HeroSection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-foreground pt-16">
      {/*
        DECORATIVE, AND aria-hidden FOR A CONCRETE REASON. The marquee repeats
        each card six times per row across five rows, so without this a screen
        reader reads roughly three hundred image descriptions before reaching the
        headline. Hiding the whole layer is the correct treatment for background
        imagery and needs no change to the vendored component.

        The card and fade classes are passed rather than edited into the
        component so it stays a clean upstream copy. They exist to hold the
        site's two hardest rules (docs/UI-PRINCIPLES.md §8): radius 0 and no
        shadows. The component ships rounded-xl and shadow-2xl, and tailwind-merge
        lets the later classes win. The fades ship from-white, which would have
        bled a white band across the top and bottom of a black section.
      */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <DiagonalMarqueeCarousel
          cards={HERO_CARDS}
          angle={-25}
          baseSpeed={120}
          className="absolute -inset-5 h-[calc(100%+2.5rem)] max-h-none w-[calc(100%+2.5rem)] max-w-none"
          cardClassName="rounded-none shadow-none cursor-default border border-background/10"
          fadeClassName="from-foreground"
        />
        {/*
          The scrim is what makes the headline legible, and it is why the cards
          each carry their own bg-black/40 as well. Measured against the lightest
          card in the set (the uranium-glass UV shot): white display type over the
          bare marquee fails WCAG AA, and over this it does not. If the card set
          is ever swapped for brighter photographs, re-check it rather than
          assuming this opacity still holds.
        */}
        <div className="absolute inset-0 bg-foreground/75" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 mb-8"
            >
              <span className="text-sm font-bold uppercase tracking-widest font-heading">Veteran-Owned Business</span>
            </motion.div>

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
              className="w-full max-w-xl h-1 bg-accent mb-5"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-background/80 text-base md:text-lg leading-relaxed mb-10 max-w-lg"
            >
              A complete estate service from evaluating the assets, conducting the sale, to getting the home and
              property ready for sale.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4"
            >
              <a
                href="tel:4129697757"
                className="inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 font-heading font-black text-xl md:text-2xl uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-6 h-6" />
                412-969-7757
              </a>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-background text-background px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-background/10 transition-colors"
                >
                  Free Evaluation
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
              >
                How We Get It Done
                <ArrowDown className="w-5 h-5" />
              </a>
            </motion.div>

            {showForm && (
              <div className="mt-6 max-w-lg">
                <HeroLeadForm />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* data-loop-animation: this never settles, so framer-motion rewrites its
          inline transform every frame and a snapshot captures whichever value the
          capture happened to land on. The prerender crawl strips the style
          attribute of anything carrying this, which is what makes two builds of
          one commit byte-identical. Any other infinite animation needs the same
          attribute — the marquee does NOT, because a CSS animation never writes
          to the inline style the snapshot reads. */}
      <motion.div
        data-loop-animation
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="w-6 h-6 text-background/40" />
      </motion.div>
    </section>
  );
}
