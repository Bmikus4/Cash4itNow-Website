import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Phone, ArrowDown, ChevronRight } from "lucide-react";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";
import HeroLeadForm from "@/components/home/HeroLeadForm";

// Travel of the image box, in px, at the far edge of the section. Large enough
// that the parallax reads as deliberate rather than as a rendering wobble.
//
// Translation only, deliberately: the slider inside maps drag position through
// getBoundingClientRect, and a rotate or scale on any ancestor distorts that
// rect, so the handle would drift away from the pointer. A translate shifts the
// rect exactly and leaves the mapping correct.
const SHIFT_X = 30;
const SHIFT_Y = 22;

export default function HeroSection() {
  const [showForm, setShowForm] = useState(false);
  const reduceMotion = useReducedMotion();

  // -0.5 … 0.5 across the section, so the box is centred when the pointer is.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 110, damping: 18, mass: 0.5 });
  const springY = useSpring(pointerY, { stiffness: 110, damping: 18, mass: 0.5 });

  const x = useTransform(springX, [-0.5, 0.5], [-SHIFT_X, SHIFT_X]);
  const y = useTransform(springY, [-0.5, 0.5], [-SHIFT_Y, SHIFT_Y]);
  // The offset block slides against the box, which is what makes it read as
  // floating rather than as the whole panel sliding. The range is biased so it
  // still sits proud of the box at rest, before the pointer has moved.
  const shadowX = useTransform(springX, [-0.5, 0.5], [34, -10]);
  const shadowY = useTransform(springY, [-0.5, 0.5], [34, -10]);

  const handlePointerMove = (e) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-foreground pt-16"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      {/* Left: headline + CTAs */}
      <div className="relative z-10 flex items-center w-full md:w-1/2 px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl w-full">
          {/* Veteran badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 mb-8"
          >
            <span className="text-sm font-bold uppercase tracking-widest font-heading">Veteran-Owned Business</span>
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
          </motion.div>

          {showForm && (
            <div className="mt-4 max-w-lg">
              <HeroLeadForm />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4"
          >
            {/* w-full on mobile so all three CTAs share one edge; the two above
                are flex children of a column and stretch by default. */}
            <a
              href="#services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-5 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
            >
              How We Get It Done
              <ArrowDown className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Right: before / after estate cleanout slider, boxed and floating */}
      <div className="relative w-full md:w-1/2 flex items-center justify-center px-6 pb-16 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ x, y }}
          className="relative w-full max-w-xl h-[55vh] md:h-[68vh] border-4 border-background"
        >
          {/* Offset block behind the box; it slides opposite the box under the
              pointer, which is what sells the depth. The box itself must stay
              transparent — an opaque background on this transformed element
              would paint over a -z-10 child and the block would never show. */}
          <motion.div
            aria-hidden="true"
            style={{ x: shadowX, y: shadowY }}
            className="absolute inset-0 bg-accent -z-10"
          />
          <BeforeAfterSlider
            beforeSrc="/hero-before.webp"
            afterSrc="/hero-after.webp"
            beforeLabel="Before"
            afterLabel="After"
            className="absolute inset-0 w-full h-full"
          />
          {/* Red corner accent */}
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[90px] border-t-accent border-l-[90px] border-l-transparent opacity-90 pointer-events-none" />
        </motion.div>
      </div>

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
