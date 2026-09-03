import React, { useEffect, useRef } from "react";
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
 * plus the wheel when the pointer is over the cards, plus a skew taken from that
 * same velocity. Scroll and the cards run ahead and lean; stop and they settle.
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

/**
 * THE EDGES DISSOLVE, THEY DO NOT DARKEN. This was two black scrims — a flat
 * bg-black/80 on mobile and a from-black gradient on desktop — painted OVER the
 * ribbon to keep white type legible across it. They worked, and they were wrong
 * the moment the kinetic grid went in behind the hero: a black scrim hides the
 * grid just as effectively as it hides the cards, so the left half of the hero
 * was a black rectangle sitting on top of the thing it was meant to sit in.
 *
 * A MASK is the fix rather than another overlay, because a mask removes the
 * cards instead of covering them — what shows through where the ribbon fades is
 * the grid, not paint. Both axes are masked so the band dissolves on all four
 * sides rather than being cut off by the container's overflow.
 *
 * The two are combined with mask-composite: intersect (WebKit spells the same
 * thing source-in), so a pixel survives only where BOTH gradients keep it.
 */
const FADE_X = "linear-gradient(to right, transparent 0%, #000 34%, #000 84%, transparent 100%)";
const FADE_Y = "linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)";
const DISSOLVE = {
  maskImage: `${FADE_X}, ${FADE_Y}`,
  WebkitMaskImage: `${FADE_X}, ${FADE_Y}`,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

/** Fades each row out along its own direction of travel, before the box mask. */
const ROW_FADE = "linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)";

function Ribbon({ items, speed, direction, wheelOffset, reduceMotion }) {
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

  // The wheel offset is shared by all three rows and only its CHANGE is consumed,
  // so a row that mounts late does not jump by the whole accumulated total.
  const lastWheel = useRef(0);

  useAnimationFrame((_t, delta) => {
    if (reduceMotion) return;
    const seconds = delta / 1000;
    let moveBy = direction * speed * seconds;
    // Scroll velocity scales the drift rather than adding to it, so a flick
    // accelerates the ribbon in the direction it is already going instead of
    // fighting it, and a hard enough flick reverses it.
    moveBy += moveBy * velocityFactor.get();

    const wheeled = wheelOffset.get();
    moveBy += direction * (wheeled - lastWheel.current);
    lastWheel.current = wheeled;

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden" style={{ maskImage: ROW_FADE, WebkitMaskImage: ROW_FADE }}>
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
  const boxRef = useRef(null);

  // Raw accumulated wheel distance, then sprung, so a scrub over the cards has
  // the same weight as a scroll flick rather than snapping frame to frame.
  const wheelRaw = useMotionValue(0);
  const wheelOffset = useSpring(wheelRaw, { damping: 40, stiffness: 220, mass: 0.6 });

  /*
   * THE WHEEL OVER THE CARDS MOVES THE CARDS, AND THE PAGE STAYS PUT. Ben's
   * ask. It is a window listener rather than a handler on the ribbon because
   * the ribbon is pointer-events:none and must stay that way — six repeated
   * images must never swallow a click meant for the CTA — and a wheel event
   * over a pointer-events:none element is delivered to whatever is underneath,
   * so there is nothing to attach to. Hit-testing the rect gives the same
   * result without touching pointer-events at all.
   *
   * THE REGION IS THE RIBBON'S BOX: the right 62% of the hero, full height. It
   * was going to be the rotated band's own rect, until measuring showed the two
   * are the same thing — a 190%-wide row rotated 22 degrees has a bounding box
   * taller than the hero, so intersecting with it clips nothing. THE TRADE THIS
   * MAKES IS REAL AND DELIBERATE: with the cursor on the right-hand side of the
   * hero there is no way to scroll the page, only the cards; the visitor has to
   * move left. That is the behaviour Ben asked for, not an oversight to correct.
   *
   * passive:false is required — a passive listener cannot preventDefault, and
   * Chrome makes wheel listeners passive by default. Without it the page scrolls
   * anyway and the whole thing silently does nothing.
   *
   * TOUCH IS DELIBERATELY EXCLUDED. Blocking touchmove over a band that spans
   * the full width on a phone would leave no way to scroll past the hero.
   */
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (typeof window === "undefined") return undefined;
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;

    const onWheel = (event) => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const inside =
        event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) return;
      event.preventDefault();
      wheelRaw.set(wheelRaw.get() + event.deltaY);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [reduceMotion, wheelRaw]);

  if (!items?.length) return null;

  return (
    /*
     * aria-hidden and pointer-events-none. The ribbon repeats every item twice
     * per row across three rows, so without this a screen reader reads the same
     * handful of images six times over before reaching the headline — and the
     * cards must never eat a click meant for the CTA underneath them.
     *
     * opacity below md is the mobile half of the legibility problem the black
     * scrim used to solve. There is no beside on a phone: the ribbon is directly
     * BEHIND the copy, and the only ways to keep white type readable over a
     * brightly lit photograph of silverware are to cover the photograph or to
     * make less of it. Covering it is what hid the grid, so the cards are ghosted
     * to a quarter instead and the grid reads through them.
     */
    <div
      ref={boxRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full overflow-hidden opacity-25 md:w-[62%] md:opacity-100"
      style={DISSOLVE}
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
              wheelOffset={wheelOffset}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
