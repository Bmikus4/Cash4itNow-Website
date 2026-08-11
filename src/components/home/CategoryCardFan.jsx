import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CATEGORIES } from "@/content/categories";

/**
 * What We Buy, as real text.
 *
 * THE DEFECT THIS REPLACES: this section's entire body was one flat .webp — a
 * phone screenshot of a Facebook flyer carrying every category name as PIXELS.
 * On the one section whose whole job is saying what the business buys, not a
 * single category name was readable by a crawler, an AI assistant, or a screen
 * reader. Every name below is now markup.
 *
 * The names come from src/content/categories.js, which is the same list
 * /categories renders and the same list the OfferCatalog JSON-LD is built from.
 * NOT transcribed from the flyer, and nothing added: a list of what a business
 * buys is a factual claim about that business, so it has exactly one source.
 *
 * §7.1's system, which a fan is a layout inside rather than a licence to leave:
 * radius 0, 2px borders, hard corners, no shadow, no gradient. The fan reads
 * through the tilt of the cards, not through softness.
 */

/**
 * The arc, repeating every five cards so it lands the same way whatever the
 * column count is at a given breakpoint — a pattern keyed to the row width would
 * be wrong at every breakpoint but one.
 *
 * The tilt is handed to framer as `rotate`/`y` rather than written as a Tailwind
 * class or a raw inline `transform`, and both of those alternatives are traps:
 * Tailwind scans src/** for LITERAL class strings, so a rotation built into a
 * computed template silently emits no CSS and fails at build time only (the same
 * trap the sale grid's class strings are documented for); and a raw inline
 * `transform` cannot be overridden on hover by `rotate-0`, because a Tailwind
 * rotate utility only sets a CSS variable that the inline property never reads.
 * Framer composes rotate and y into the transform itself, so one owner, no
 * fight, and the hover state is expressed in the same vocabulary.
 */
const FAN_ANGLES = [-1.5, -0.75, 0, 0.75, 1.5];
const fanAngle = (i) => FAN_ANGLES[i % FAN_ANGLES.length];

export default function CategoryCardFan() {
  // ITS OWN GUARD, not a global blanket. A component that depends on a blanket
  // it does not ship is broken the moment it is moved to a page that lacks one —
  // and this one is built to be moved. framer's hook reads the media query
  // directly and re-renders on change, so it also survives the user flipping the
  // OS setting with the page open.
  const reduceMotion = useReducedMotion();

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
      {CATEGORIES.map((category, i) => (
        <motion.li
          key={category.title}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(i, 5) * 0.04 }}
        >
          {/* Tilt and hover on an inner element, so the outer one is free to own
              the entrance without two animations writing the same transform. */}
          <motion.div
            style={reduceMotion ? undefined : { rotate: fanAngle(i), y: Math.abs(fanAngle(i)) * 2 }}
            whileHover={reduceMotion ? undefined : { rotate: 0, y: -6 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="h-full bg-background border-2 border-foreground p-5 md:p-6 origin-bottom hover:border-accent focus-within:border-accent"
          >
            <div className="flex items-baseline gap-3 mb-3">
              <span aria-hidden="true" className="font-heading font-black text-accent text-lg leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-heading font-black text-base md:text-lg uppercase tracking-tight leading-tight">
                {category.title}
              </h3>
            </div>
            <div className="h-1 w-10 bg-accent mb-3" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              {category.items.join(" · ")}
            </p>
          </motion.div>
        </motion.li>
      ))}
    </ul>
  );
}
