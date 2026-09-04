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
 * the grid, not paint.
 *
 * THE FALLOFF IS IN PIXELS, NOT PERCENT. A percentage ramp is a fraction of the
 * BOX, so 8% of a 900px hero was a 72px smear that grew with the viewport — most
 * of a card at every size, and more of one on a wide monitor. A fixed distance is
 * a literal edge and does not change when the window does.
 *
 * ONLY THE VERTICAL AXIS IS MASKED HERE. The horizontal ends belong to the rows,
 * because each row needs its own — see rowFade. Masking both here as well would
 * ramp the outer rows twice at the same edge.
 */
const EDGE_PX = 44;

const FADE_Y = `linear-gradient(to bottom, transparent 0px, #000 ${EDGE_PX}px, #000 calc(100% - ${EDGE_PX}px), transparent 100%)`;
const DISSOLVE = {
  maskImage: FADE_Y,
  WebkitMaskImage: FADE_Y,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

/** How far a row's own fade runs, along the row. */
const ROW_FADE_PX = 44;

/**
 * HOW MUCH OF A ROW IS OFF SCREEN AT EACH END, as a fraction of the row's own
 * width, for a row through the middle of the box.
 *
 * It is a constant rather than a measurement because the geometry is
 * scale-invariant. The band is BAND_WIDTH_RATIO of the box in every direction,
 * and the box's width cuts across a row rotated by BAND_DEG, so the visible
 * length of a row is boxWidth / cos(BAND_DEG) whatever the viewport is doing:
 *
 *   visible / rowWidth = 1 / (BAND_WIDTH_RATIO * cos(BAND_DEG)) = 0.568
 *   clipped per side   = (1 - 0.568) / 2                        = 0.216
 */
const BAND_WIDTH_RATIO = 1.9;
const BAND_RAD = (BAND_DEG * Math.PI) / 180;
const ROW_CLIPPED_FRACTION = (1 - 1 / (BAND_WIDTH_RATIO * Math.cos(BAND_RAD))) / 2;

/**
 * WHY THE TWO ENDS OF A ROW ARE NOT INSET BY THE SAME AMOUNT, which is the bug
 * Ben spotted as "you may have moved them the wrong way".
 *
 * Only the middle row runs through the centre of the box. The other two are
 * offset perpendicular to their own direction, and because they are rotated,
 * that perpendicular offset also slides them SIDEWAYS: the top row's midpoint
 * sits about 115px right of the box's centre and the bottom row's about 115px
 * left of it. So the part of a row you can see is not centred on the row, and
 * taking the same number of pixels off each END of the row takes different
 * amounts off each end of what is actually ON SCREEN. It reads as the row having
 * been shifted rather than shortened.
 *
 * The correction is that sideways slide, which is d * tan(BAND_DEG) for a row at
 * perpendicular offset d. Add it to one end and subtract it from the other and
 * the visible segment is trimmed evenly, which is what Ben asked for: every row
 * ending on the same two lines, the outer two just slightly shorter.
 */
const rowOffset = (index) => (index - (ROWS.length - 1) / 2) * ROW_PITCH;
const rowShift = (index) => Math.tan(BAND_RAD) * rowOffset(index);

/**
 * THE STAGGER, AND IT IS MEANT TO BE BARELY THERE. The top and bottom rows give
 * up this much at each visible end and the middle row gives up none, so the three
 * are the same length bar a hair. It was a whole card once and then 32px; Ben:
 * "SLIGHTLY smaller, like slightly".
 *
 * It is an INSET ON THE MASK, not on the layout. Padding the row would change
 * its width, and the wrap that makes the loop seamless is computed from the item
 * count times SPAN — shortening the track would put a visible seam in the two
 * outer rows. Masking leaves the track exactly as long and stops drawing sooner.
 */
const STAGGER_PX = 24;
const isOuterRow = (index) => index === 0 || index === ROWS.length - 1;
const CLIPPED_CSS = `${(ROW_CLIPPED_FRACTION * 100).toFixed(2)}%`;

/** Dead length at a row's left and right ends, in px, given its measured width. */
function rowInsets(index, rowWidth) {
  const base = ROW_CLIPPED_FRACTION * rowWidth + (isOuterRow(index) ? STAGGER_PX : 0);
  return { left: base + rowShift(index), right: base - rowShift(index) };
}

/** Fades one row out along its own direction of travel. */
function rowFade(index) {
  const bite = isOuterRow(index) ? STAGGER_PX : 0;
  const left = rowShift(index) + bite;
  const right = -rowShift(index) + bite;
  const px = (n) => `${n.toFixed(1)}px`;
  return (
    `linear-gradient(to right, ` +
    `transparent 0px, transparent calc(${CLIPPED_CSS} + ${px(left)}), ` +
    `#000 calc(${CLIPPED_CSS} + ${px(left + ROW_FADE_PX)}), ` +
    `#000 calc(100% - ${CLIPPED_CSS} - ${px(right + ROW_FADE_PX)}), ` +
    `transparent calc(100% - ${CLIPPED_CSS} - ${px(right)}), transparent 100%)`
  );
}

/**
 * Which row, if any, is under a page-space point.
 *
 * IT IS ARITHMETIC RATHER THAN HIT-TESTING because the ribbon is
 * pointer-events:none and has to stay that way: the mask makes cards invisible
 * near the edges WITHOUT making them untouchable, so anything relying on the
 * browser's own hit-testing would let a card nobody can see swallow a click.
 * getBoundingClientRect is no use either — the rows are rotated, so all three
 * axis-aligned boxes overlap almost completely and every point would match every
 * row. So the point is rotated back into the band's own coordinates, where the
 * rows are plain horizontal strips.
 *
 * THE REGION IS WRAPPED TIGHT ROUND THE CARDS. Ben's rule, in his words: spaces
 * between cards scroll, space outside a card does not, and a card that has begun
 * to fade does not. That is three tests:
 *
 *   1. Not inside either mask's ramp. Both are checked in the space each one is
 *      actually applied in — the box mask is axis-aligned in the container, the
 *      row mask runs along the rotated row — because a single test in one space
 *      would be wrong about the other by up to the band's rotation.
 *   2. Inside the band's vertical extent, which spans the first row's top to the
 *      last row's bottom and therefore INCLUDES the gaps between rows. Those are
 *      spaces between cards, so they scroll.
 *   3. Inside that row's own unfaded length, which is shorter for the staggered
 *      top and bottom rows by exactly the card they gave up.
 *
 * WHAT IS DELIBERATELY NOT TESTED is which individual card is under the pointer.
 * The cards drift, so a stationary cursor would cross a card edge every couple of
 * seconds and the row would stutter between paused and running on its own. The
 * horizontal gaps between cards ride inside the row strip and scroll for free,
 * which is the behaviour asked for anyway.
 *
 * A point in the gap between two rows drives the NEARER row, so the wheel always
 * does something and always the same thing at a given spot.
 */
function rowAtPoint(clientX, clientY, box, band) {
  if (!box || !band) return -1;

  // 1a. The box mask, which is vertical only — the horizontal ends belong to the
  // rows and are checked below, in the space they are actually applied in.
  const b = box.getBoundingClientRect();
  const bx = clientX - b.left;
  const by = clientY - b.top;
  if (bx < 0 || bx > b.width) return -1;
  if (by < EDGE_PX || by > b.height - EDGE_PX) return -1;

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

  // 2. Top of the first row to the bottom of the last, gaps included.
  if (Math.abs(localY) > height / 2) return -1;

  const fromTop = localY + height / 2;
  let index = Math.min(ROWS.length - 1, Math.max(0, Math.floor(fromTop / ROW_PITCH)));
  const withinRow = fromTop - index * ROW_PITCH;
  if (withinRow > CARD_H && index + 1 < ROWS.length) {
    const toNextRow = ROW_PITCH - withinRow;
    if (toNextRow < withinRow - CARD_H) index += 1;
  }

  // 1b + 3. The row mask, along the rotated row, inset by the stagger.
  const rowX = localX + width / 2;
  const dead = rowInsets(index, width);
  if (rowX < dead.left + ROW_FADE_PX) return -1;
  if (rowX > width - dead.right - ROW_FADE_PX) return -1;

  return index;
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
    <div className="overflow-hidden" style={{ maskImage: rowFade(index), WebkitMaskImage: rowFade(index) }}>
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
      const index = rowAtPoint(event.clientX, event.clientY, boxRef.current, bandRef.current);
      if (index < 0) return;
      event.preventDefault();
      pushers.current[index]?.(event.deltaY);
    };
    const onMove = (event) => {
      setHovered(rowAtPoint(event.clientX, event.clientY, boxRef.current, bandRef.current));
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
      ref={boxRef}
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
