import React, { useCallback, useEffect, useRef, useState } from "react";
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
 * plus the wheel when the pointer is over that row, plus a skew taken from that
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

/**
 * PORTRAIT, on Ben's "rotate the cards 90 degrees". The frame turns; the
 * photographs inside do NOT. Rotating the images too would stand every object in
 * them on its side, which is not what a rotated card means here — it is the
 * card's proportion that changes, and object-cover re-crops each photograph to
 * suit. 260x180 became 180x260, nothing else moved.
 */
const CARD_W = 180;
const CARD_H = 260;
const GAP = 24;
const SPAN = CARD_W + GAP;
const ROW_PITCH = CARD_H + GAP;

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

/** The band's rotation, in degrees, and the hit test below has to undo it. */
const BAND_DEG = -22;

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
 * THE FALLOFF IS SHORT, on Ben's call: the fade was 34% of the box on the left
 * and is 8% now. Long ramps left most of the ribbon at partial alpha, so the
 * cards read as washed out rather than as cards that end. Short ramps mean the
 * cards are themselves almost everywhere and only let go at the very edge.
 *
 * The two are combined with mask-composite: intersect (WebKit spells the same
 * thing source-in), so a pixel survives only where BOTH gradients keep it.
 */
const FADE_X = "linear-gradient(to right, transparent 0%, #000 8%, #000 94%, transparent 100%)";
const FADE_Y = "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)";
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
const ROW_FADE = "linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%)";

/**
 * Which row, if any, is under a page-space point.
 *
 * IT IS ARITHMETIC RATHER THAN HIT-TESTING because the ribbon is
 * pointer-events:none and has to stay that way: the mask makes cards invisible
 * near the edges WITHOUT making them untouchable, so anything relying on the
 * browser's own hit-testing would let a card nobody can see swallow a click.
 * getBoundingClientRect is no use either — the rows are rotated, so all three
 * axis-aligned boxes overlap almost completely and every point would match every
 * row.
 *
 * So the point is rotated back into the band's own coordinates, where the rows
 * are plain horizontal strips. A point in the GAP between two rows belongs to
 * neither, which is deliberate: the wheel is only captured over a row, so the
 * page still scrolls from the space between them.
 */
function rowAtPoint(clientX, clientY, band) {
  if (!band) return -1;
  const rect = band.getBoundingClientRect();
  const dx = clientX - (rect.left + rect.right) / 2;
  const dy = clientY - (rect.top + rect.bottom) / 2;
  const t = (-BAND_DEG * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const width = band.offsetWidth;
  const height = band.offsetHeight;
  if (Math.abs(localX) > width / 2 || Math.abs(localY) > height / 2) return -1;

  const fromTop = localY + height / 2;
  const index = Math.floor(fromTop / ROW_PITCH);
  if (index < 0 || index >= ROWS.length) return -1;
  return fromTop - index * ROW_PITCH <= CARD_H ? index : -1;
}

function Ribbon({ items, speed, direction, index, paused, register, reduceMotion }) {
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

  // THIS ROW'S OWN WHEEL, not one shared by all three. Ben: scrolling should work
  // per-row. The parent hit-tests the pointer and pushes deltas into whichever
  // row is under it, through the callback registered here.
  const wheelRaw = useMotionValue(0);
  const wheelOffset = useSpring(wheelRaw, { damping: 40, stiffness: 220, mass: 0.6 });
  useEffect(
    () => register(index, (delta) => wheelRaw.set(wheelRaw.get() + delta)),
    [index, register, wheelRaw]
  );

  // Read through a ref inside the frame loop: useAnimationFrame holds the
  // callback it was given, so a prop read directly would be the value from the
  // render that installed it.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Two copies of the list, wrapped over exactly one copy's width, so the seam
  // is never visible and the loop needs no measurement of the DOM.
  const half = items.length * SPAN;
  const x = useTransform(baseX, (v) => `${wrap(-half, 0, v)}px`);

  const lastWheel = useRef(0);

  useAnimationFrame((_t, delta) => {
    if (reduceMotion) return;

    // Hovering a card stops THAT row and nothing else, which is the point of it:
    // the drift is what makes a card hard to look at, and stopping every row
    // would read as the whole thing breaking rather than as one row waiting.
    let moveBy = 0;
    if (!pausedRef.current) {
      moveBy = direction * speed * (delta / 1000);
      // Scroll velocity scales the drift rather than adding to it, so a flick
      // accelerates the ribbon in the direction it is already going instead of
      // fighting it, and a hard enough flick reverses it.
      moveBy += moveBy * velocityFactor.get();
    }

    // The wheel keeps working while a row is paused — stopping the drift is what
    // makes scrubbing it by hand useful in the first place.
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
  const bandRef = useRef(null);
  const pushers = useRef([]);
  const [hovered, setHovered] = useState(-1);

  const register = useCallback((index, push) => {
    pushers.current[index] = push;
  }, []);

  /*
   * THE WHEEL OVER A ROW MOVES THAT ROW, AND THE PAGE STAYS PUT. Ben's ask,
   * twice: first that the window not scroll over the cards, then that it work
   * per-row. It is a window listener rather than a handler on the ribbon because
   * the ribbon is pointer-events:none and must stay that way — six repeats of
   * the same photographs must never swallow a click meant for the CTA, and the
   * mask makes cards invisible without making them untouchable, so an unseen
   * card would be the one catching it. A wheel event over a pointer-events:none
   * element is delivered to whatever is underneath, so there is nothing to bind
   * to anyway.
   *
   * NOT CAPTURED BETWEEN THE ROWS. rowAtPoint returns -1 in the gaps and off the
   * band, and the page scrolls normally there — which is what keeps a
   * full-height hero from trapping a visitor whose cursor happens to be on the
   * right-hand side.
   *
   * passive:false is required. Chrome makes wheel listeners passive by default,
   * a passive listener cannot preventDefault, and without it the page scrolls
   * anyway and the whole thing silently does nothing.
   *
   * TOUCH IS DELIBERATELY EXCLUDED. Blocking touchmove over a band that spans
   * the full width of a phone would leave no way to reach the rest of the page.
   */
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (typeof window === "undefined") return undefined;
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;

    const onWheel = (event) => {
      const index = rowAtPoint(event.clientX, event.clientY, bandRef.current);
      if (index < 0) return;
      event.preventDefault();
      pushers.current[index]?.(event.deltaY);
    };
    const onMove = (event) => {
      setHovered(rowAtPoint(event.clientX, event.clientY, bandRef.current));
    };
    const onLeave = () => setHovered(-1);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  if (!items?.length) return null;

  return (
    /*
     * aria-hidden and pointer-events-none. The ribbon repeats every item twice
     * per row across three rows, so without this a screen reader reads the same
     * handful of images six times over before reaching the headline — and the
     * cards must never eat a click meant for the CTA underneath them.
     *
     * opacity is the half of the legibility problem a mask cannot solve. Where
     * the ribbon is BEHIND the copy rather than beside it, the only ways to keep
     * white type readable over a brightly lit photograph of silverware are to
     * cover the photograph or to have less of it. Covering it is what hid the
     * grid, so the cards are ghosted instead and the grid reads through them.
     *
     * IT RAMPS OVER THREE BREAKPOINTS, and every step was screenshotted rather
     * than chosen. The reason it cannot be one step is that the ribbon's width
     * is a PERCENTAGE while the copy's is FIXED (max-w-xl), so the two overlap
     * by an amount that shrinks as the viewport grows and is never zero below
     * 1280: 62% of 768 leaves the paragraph and the second CTA sitting on fully
     * lit cards, and at 1024 the line ends still cross them. Only at xl does
     * beside become literally true, and only there do the cards come up to full.
     *
     * Widening the box and brightening it are therefore two different
     * breakpoints. They were one until this was screenshotted at 768.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full overflow-hidden opacity-25 md:w-[62%] lg:opacity-60 xl:opacity-100"
      style={DISSOLVE}
    >
      <div
        ref={bandRef}
        className="absolute left-1/2 top-1/2 w-[190%]"
        /* The transform is written out rather than composed from Tailwind
           classes because rowAtPoint has to undo exactly this rotation, and
           BAND_DEG is the one place the angle is stated. */
        style={{ transform: `translate(-50%, -50%) rotate(${BAND_DEG}deg)` }}
      >
        <div className="flex flex-col" style={{ gap: GAP }}>
          {ROWS.map((row, i) => (
            <Ribbon
              key={i}
              index={i}
              /* Offsetting the start of each row stops the three from lining up
                 into one visible column of edges. */
              items={[...items.slice(i), ...items.slice(0, i)]}
              speed={row.speed}
              direction={row.direction}
              paused={hovered === i}
              register={register}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
