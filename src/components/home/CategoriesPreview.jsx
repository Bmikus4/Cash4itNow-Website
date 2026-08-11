import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CategoryCardFan from "@/components/home/CategoryCardFan";

const FLYER = "/img/3e4c31ddb_Screenshot_20260524_215817_Facebook.webp";

export default function CategoriesPreview() {
  return (
    <section id="what-we-buy" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16 text-center">
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-foreground mb-2">
            What We Buy
          </h2>
          <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
        </motion.div>

        {/* The categories, as text. This was one flat .webp of a Facebook flyer
            until 2026-08-11 — every name in it was pixels, so the section that
            exists to say what we buy said nothing to a crawler or a screen
            reader. Do not put the image back in its place. */}
        <CategoryCardFan />

        {/* The flyer stays, BELOW the text and demoted to what it actually is:
            a real flyer, which reads as proof that this is the business's own
            list rather than a page written for search engines. Its alt does NOT
            recite the categories — the cards above are the text now, and an alt
            attribute repeating them would be the same list a third time, drifting
            the moment one is edited. */}
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 m-0">
          <figcaption className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">
            The original flyer
          </figcaption>
          <div className="overflow-hidden border-2 border-foreground">
            <img
              src={FLYER}
              alt="The Cash 4 It Now buying flyer, as posted to Facebook"
              className="w-full h-auto object-contain"
            />
          </div>
        </motion.figure>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10">
          <Link
            to="/categories"
            className="inline-flex items-center justify-center bg-foreground text-background font-heading font-bold text-lg uppercase tracking-wide px-10 py-4 hover:bg-accent transition-colors duration-200">
            See Everything We Buy →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}