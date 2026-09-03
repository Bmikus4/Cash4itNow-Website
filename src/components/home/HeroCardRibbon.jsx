import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";

/**
 * The hero's image asset: diagonal ribbons of item cards on the right.
 *
 * WHY THIS EXISTS INSTEAD OF THE VENDORED MARQUEE. Ben asked for the cards to be
 * rubbery and to respond to scrolling. The vendored diagonal-marquee ran on CSS
 * @keyframes, and a keyframe animation cannot be coupled to scroll velocity —
 * its position is a function of elapsed time and nothing else. Everything below
 * that makes the ribbon feel physical comes from driving x from a motion value
 * instead: a base drift, plus the spring-smoothed velocity of the page scroll,
 * plus a skew taken from that same velocity. Scroll down and the cards run ahead
 * and lean; stop and they settle back. That is the rubber.
 *
 * IT IS THE ASSET, NOT A BACKGROUND. It sits where the before/after slider used
 * to, in the right half of the hero, rather than as a full-bleed layer behind the
 * type. Ben's markup of the live page is what settled the composition: three
 * ribbons running up to the right, in the space beside the headline.
 *
 * ROUNDED, ON HIS CALL. docs/UI-PRINCIPLES.md §8 rule 1 is radius 0 across the
 * whole site, and these cards are the one deliberate exception. If that rule is
 * ever re-derived from the code, this is the exception to carry forward, not a
 * drift to correct.
 *
 * WHAT FILLS THEM. Real catalog items the moment the platform publishes any, and
 * the standing inventory photographs until then. The live feed currently sends
 * `catalog` as a reference ({slug, itemCount}) with no items, so the fallback is
 * what renders today and the swap needs no change here.
 */

const CARD_W = 260;
const CARD_H = 180;
const GAP = 24;
const SPAN = CARD_W + GAP;

/**
 * Pixels per second, and 40% slower than what it replaced, which is the number
 * Ben asked for rather than a feel.
 *
 * The old CSS marquee translated a 23,328px track by half its width over 120s,
 * which is 97px/s. 60% of that is 58. The rows differ slightly so they do not
 * read as one rigid sheet, and the middle one runs the other way for the same
 * reason.
 */
const ROWS = [
  { speed: 52, direction: -1 },
  { speed: 58, direction: 1 },
  { speed: 64, direction: -1 },
];

/** Fades the ribbon out where it ends, along the direction of travel. */
const EDGE_FADE = "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)";

function Ribbon({ items, speed, direction, reduceMotion }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // The spring is the rubber. Raw scroll velocity is spiky and would read as a
  // glitch; damped, it overshoots slightly and settles, which is what makes the
  // ribbon feel like it has weight rather than like it is being redrawn.
  const smoothVelocity = useSpring(scrollVelocity, { damping: 42, stiffness: 180, mass: 0.7 });

  // clamp:false on purpose — a fast flick should be allowed past the ends of the
  // range and even reverse the drift, which is most of the effect.
  const velocityFactor = useTransform(smoothVelocity, [-2200, 2200], [-4, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2200, 2200], [5, -5], { clamp: false });

  // Two copies of the list, wrapped over exactly one copy's width, so the seam
  // is never visible and the loop needs no measurement of the DOM.
  const half = items.length * SPAN;
  const x = useTransform(baseX, (v) => `${wrap(-half, 0, v)}px`);

  useAnimationFrame((_t, delta) => {
    if (reduceMotion) return;
    const seconds = delta / 1000;
    let moveBy = direction * speed * seconds;
    // Scroll velocity scales the drift rather than adding to it, so a flick
    // accelerates the ribbon in the direction it is already going instead of
    // fighting it, and a hard enough flick reverses it.
    moveBy += moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden" style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}>
      <motion.div className="flex" style={{ x, gap: GAP, skewX: reduceMotion ? 0 : skew }}>
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            style={{ width: CARD_W, height: CARD_H }}
          >
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function HeroCardRibbon({ items }) {
  const reduceMotion = useReducedMotion();
  if (!items?.length) return null;

  return (
    /*
     * aria-hidden and pointer-events-none. The ribbon repeats every item twice
     * per row across three rows, so without this a screen reader reads the same
     * handful of images six times over before reaching the headline — and the
     * cards must never eat a click meant for the CTA underneath them.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full overflow-hidden md:w-[62%]"
    >
      <div className="absolute left-1/2 top-1/2 w-[190%] -translate-x-1/2 -translate-y-1/2 rotate-[-22deg]">
        <div className="flex flex-col" style={{ gap: GAP }}>
          {ROWS.map((row, i) => (
            <Ribbon
              key={i}
              /* Offsetting the start of each row stops the three from lining up
                 into one visible column of edges. */
              items={[...items.slice(i), ...items.slice(0, i)]}
              speed={row.speed}
              direction={row.direction}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
      {/*
        TWO SCRIMS, BECAUSE THE RIBBON IS IN TWO DIFFERENT RELATIONSHIPS TO THE
        TYPE. At md and up it sits BESIDE the headline, so a left-to-right
        gradient is right: heavy where the text is, clear where the cards should
        be seen. Below md there is no beside — it is directly BEHIND the copy —
        and that same gradient goes transparent exactly where the paragraph ends
        up, which put white text over a brightly lit photograph of silverware and
        made it unreadable. A flat heavy scrim is the only thing that works when
        the two occupy the same space.
      */}
      <div className="pointer-events-none absolute inset-0 bg-black/80 md:hidden" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black via-black/25 to-transparent md:block" />
    </div>
  );
}
