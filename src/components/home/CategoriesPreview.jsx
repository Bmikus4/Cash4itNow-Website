import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CategoryList from "@/components/home/CategoryList";

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
        <CategoryList />

        {/* THE FLYER IS GONE FROM THIS SECTION, on Ben's call 2026-09-03.
            It had been kept below the list as "proof" that the list is the
            business's own. In practice it just meant the section still ended in
            the wall of hand-lettered pixels the list was written to replace, and
            the first thing he said on seeing the page live was that he could
            still see the image. The list IS the section now.

            The file is still in /public and still shown on /categories, where it
            is captioned as an artefact rather than used as the answer. */}

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