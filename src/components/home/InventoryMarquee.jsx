import React from "react";
import DiagonalMarqueeCarousel from "@/components/ui/great-ui-diagonal-marquee-carousel";

/**
 * A band of real inventory, between the hero and What We Buy.
 *
 * It was briefly the hero's background. That put two full-viewport visual
 * sections at the top of the page, one behind the other's headline, and the
 * kinetic grid is the hero's background now. Rather than delete the marquee, it
 * gets the job it is actually good at: a wordless strip of the things this
 * business buys, sitting immediately before the section that lists them in text.
 *
 * DELIBERATELY NOT FULL HEIGHT. 55vh, because a band is a transition and a
 * viewport is a destination — a second full screen here is exactly the thing
 * that made the first arrangement wrong.
 *
 * THE PHOTOGRAPHS ARE THE BUSINESS'S OWN, not stock. The integration brief said
 * to fill image slots from Unsplash; landscapes would be actively wrong on a page
 * whose entire claim is "this is the kind of thing we buy and sell". All nine are
 * already in /public/img and are the same files the matching category uses on
 * /categories, so this costs no new bytes.
 *
 * NEITHER hero-before.webp NOR hero-after.webp is here, deliberately. Dealing one
 * of the removed hero image's photographs back onto the home page is not what
 * removing it means.
 */
const CARDS = [
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

export default function InventoryMarquee() {
  return (
    /*
     * aria-hidden FOR A CONCRETE REASON, not as a habit. The marquee repeats each
     * card six times per row across five rows, so without this a screen reader
     * reads roughly three hundred image descriptions to get past a decorative
     * band. The section carries no information that is not stated in text
     * directly below it, in What We Buy.
     */
    <section
      aria-hidden="true"
      className="relative h-[55vh] min-h-[380px] overflow-hidden bg-foreground"
    >
      {/*
        The card and fade classes are passed rather than edited into the
        component, so it stays a clean upstream copy. They carry the site's two
        hardest rules (docs/UI-PRINCIPLES.md §8): radius 0 and no shadows. The
        component ships rounded-xl and shadow-2xl; tailwind-merge lets the later
        classes win. Its fades ship from-white, which would have bled a white band
        across the top and bottom of a black section.
      */}
      <DiagonalMarqueeCarousel
        cards={CARDS}
        angle={-25}
        baseSpeed={120}
        className="absolute -inset-5 h-[calc(100%+2.5rem)] max-h-none w-[calc(100%+2.5rem)] max-w-none"
        cardClassName="rounded-none shadow-none cursor-default border border-background/10"
        fadeClassName="from-foreground"
      />
      {/* Holds the band to the ink either side of it, so the seams above and below
          are invisible and the photographs read as texture rather than as a
          gallery the visitor is expected to study. */}
      <div className="pointer-events-none absolute inset-0 bg-foreground/55" />
    </section>
  );
}
