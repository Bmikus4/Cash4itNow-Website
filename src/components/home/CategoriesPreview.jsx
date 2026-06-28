import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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

        {/* Flyer image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden border-2 border-foreground">
          <img
            src={FLYER}
            alt="Cash 4 It Now — Everything We Buy"
            className="w-full h-auto object-contain"
          />
        </motion.div>

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