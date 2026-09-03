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
 * WAS CategoryCardFan, AND THE FAN IS WHY IT WAS RENAMED. It tilted each card by
 * up to 1.5deg on a site that has no rotation anywhere else, which read as
 * misalignment rather than as an arrangement — ragged card tops in every row,
 * against a design whose whole discipline is hard square corners and straight
 * hairlines. Three further faults came with it, all visible in one screenshot:
 * a three-column grid left the tenth category orphaned in a row of its own, the
 * cards were separate boxes so their heights disagreed and two of them ended
 * half empty, and the items were set in the grey reserved elsewhere for captions.
 *
 * SO IT IS A TABLE OF HAIRLINES NOW, which is what this site does with a grid
 * everywhere else (docs/UI-PRINCIPLES.md §5): one bordered block, gap-0, cells
 * divided by 1px rules. Two columns is not a taste call — CATEGORIES has ten
 * entries, so two columns is the only count that fills every row exactly, and
 * the wider cell is what lets each category's items breathe on one or two lines
 * instead of four. If a category is ever added or removed, check that number.
 */
export default function CategoryList() {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-foreground/20 list-none p-0 m-0">
      {CATEGORIES.map((category, i) => (
        <motion.li
          key={category.title}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(i, 5) * 0.04 }}
          /* Every cell carries a bottom rule and every left-column cell a right
             rule, so the block is gridded throughout and the outer border above
             closes it. The doubled edge that would otherwise fall on the last row
             is why the wrapper's border is /20 and these are /15. */
          className="border-b border-foreground/15 sm:[&:nth-child(odd)]:border-r p-6 md:p-8 hover:bg-foreground/[0.03] transition-colors"
        >
          <div className="flex items-baseline gap-3 mb-3">
            <span aria-hidden="true" className="font-heading font-black text-accent text-lg leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-heading font-black text-base md:text-lg uppercase tracking-tight leading-tight">
              {category.title}
            </h3>
          </div>
          <div className="h-1 w-10 bg-accent mb-4" />
          {/* Each item is its own element rather than one dot-joined string: a
              run of forty grey words reads as a paragraph nobody finishes, and
              the separator has to survive wrapping without stranding a dot at the
              start of a line. The colour is foreground/70 rather than the caption
              grey these were set in — these names are the content of the section,
              not a footnote to it. */}
          <ul className="flex flex-wrap gap-x-2 gap-y-1 list-none p-0 m-0">
            {category.items.map((item, n) => (
              <li key={item} className="text-foreground/70 text-sm leading-relaxed">
                {item}
                {n < category.items.length - 1 && (
                  <span aria-hidden="true" className="text-accent/50 ml-2">
                    /
                  </span>
                )}
              </li>
            ))}
          </ul>
        </motion.li>
      ))}
    </ul>
  );
}
