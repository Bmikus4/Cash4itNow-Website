import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import HeroSaleCard from "@/components/home/HeroSaleCard";

/**
 * The hero's image asset: diagonal ribbons of item cards.
 *
 * WHY THIS EXISTS INSTEAD OF THE VENDORED MARQUEE. Ben asked for the cards to be
 * rubbery and to respond to scrolling. The vendored diagonal-marquee ran on CSS
 * @keyframes, and a keyframe animation cannot be coupled to scroll velocity —
 * its position is a function of elapsed time and nothing else. Everything below
 * that makes the ribbon feel physical comes from driving x from a motion value
 * instead: a base drift, plus the spring-smoothed velocity of the page scroll,
 * plus the wheel or a finger when the pointer is over that row, plus a skew taken
 * from that same velocity. Scroll and the cards run ahead and lean; stop and they
 * settle.
 *
 * IT IS THE ASSET, NOT A BACKGROUND. On a desktop it sits where the before/after
 * slider used to, in the right half of the hero, beside the headline. On a phone
 * it is a band of its own BELOW the copy — see the container's classes.
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
 * suit.
 *
 * These are the size the cards want to be. What they actually get is this times
 * the fit factor below, because a hero is never as tall as three of them plus the
 * diagonal's rise.
 */
const BASE_CARD_W = 180;
const BASE_CARD_H = 260;
const BASE_GAP = 24;

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
const BAND_RAD = (BAND_DEG * Math.PI) / 180;
const BAND_COS = Math.cos(BAND_RAD);
const BAND_TAN = Math.tan(BAND_RAD);
/** Screen-space unit vector along a row, used to project a drag onto it. */
const ALONG_X = Math.cos(-BAND_RAD);
const ALONG_Y = -Math.sin(-BAND_RAD);

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
 *
 * IT IS ALSO THE MARGIN THE FIT LEAVES ITSELF, below: the band is sized so that
 * no row reaches this ramp, which is the whole reason the three rows now line up.
 */
const EDGE_PX = 28;

const FADE_Y = `linear-gradient(to bottom, transparent 0px, #000 ${EDGE_PX}px, #000 calc(100% - ${EDGE_PX}px), transparent 100%)`;
const DISSOLVE = {
  maskImage: FADE_Y,
  WebkitMaskImage: FADE_Y,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

/**
 * THE FIT, AND IT IS WHY THE THREE ROWS AGREE.
 *
 * WHAT WAS BROKEN. The band is taller than any hero it has ever been put in. At
 * 1440x900 it wants 828px of card stacked perpendicular to the rows — 768px of
 * screen height once rotated — plus another 361px because a row rotated 22
 * degrees CLIMBS as it crosses the box, plus the two 28px ramps: 1216px of
 * demand against 900px of hero. The overflow does not land evenly. A row climbs
 * to the RIGHT, so the top row leaves through the top of the box near its right
 * end and the bottom row leaves through the bottom near its LEFT end. Measured on
 * the live page: the top row was visible from x=611 to x=1241 and the bottom row
 * from x=747 to x=1377 — the same length of ribbon, shifted 136px apart. That is
 * Ben's "the bottom row is not positioned like the top row", and no amount of
 * adjusting the row masks could fix it, because the masks were not what was
 * cutting the rows. The box's own top and bottom were.
 *
 * WHAT HAPPENS NOW. The cards are drawn at whatever size makes the whole
 * parallelogram — three rows plus the diagonal's rise plus both ramps — fit the
 * box it has actually been given. Nothing reaches the vertical ramp any more, so
 * every row ends where its OWN mask says it ends, which is the same two vertical
 * lines for all three, the outer two shorter by the stagger. That is what the
 * previous round asked for and never got.
 *
 * WHY IT IS MEASURED RATHER THAN A BREAKPOINT. The demand depends on the box's
 * width (through the rise) and the supply on its height, and those two vary
 * independently — a 1366x768 laptop and a 1920x1080 monitor need different
 * answers, and the phone band needs a third. One measurement covers all of them
 * and cannot fall out of step with a Tailwind class somebody edits later.
 *
 * MIN_FIT stops it from answering "postage stamp" on a box that is hopeless,
 * which is a short phone in landscape. Below it the outer rows are nibbled again,
 * a little, which is the right way to fail.
 */
const MIN_FIT = 0.5;
const BAND_SPAN = ROWS.length * BASE_CARD_H + (ROWS.length - 1) * BASE_GAP;

function fitFor(boxW, boxH) {
  if (!boxW || !boxH) return 1;
  const clear = boxH - 2 * EDGE_PX - boxW * Math.abs(BAND_TAN);
  return Math.max(MIN_FIT, Math.min(1, clear / (BAND_SPAN * BAND_COS)));
}

/** Card metrics at a given fit. Everything downstream reads these, not the base. */
function metricsFor(fit) {
  const cardW = Math.round(BASE_CARD_W * fit);
  const cardH = Math.round(BASE_CARD_H * fit);
  const gap = Math.round(BASE_GAP * fit);
  return { cardW, cardH, gap, span: cardW + gap, pitch: cardH + gap };
}

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
 *
 * The fit does not enter into it: the band's WIDTH is a percentage of the box, so
 * it tracks the box however small the cards get. Only the row's height changes.
 */
const BAND_WIDTH_RATIO = 1.9;
const ROW_CLIPPED_FRACTION = (1 - 1 / (BAND_WIDTH_RATIO * BAND_COS)) / 2;
const CLIPPED_CSS = `${(ROW_CLIPPED_FRACTION * 100).toFixed(2)}%`;

/**
 * WHY THE TWO ENDS OF A ROW ARE NOT INSET BY THE SAME AMOUNT, which is the bug
 * Ben spotted as "you may have moved them the wrong way".
 *
 * Only the middle row runs through the centre of the box. The other two are
 * offset perpendicular to their own direction, and because they are rotated,
 * that perpendicular offset also slides them SIDEWAYS. So the part of a row you
 * can see is not centred on the row, and taking the same number of pixels off
 * each END of the row takes different amounts off each end of what is actually ON
 * SCREEN. It reads as the row having been shifted rather than shortened.
 *
 * The correction is that sideways slide, which is d * tan(BAND_DEG) for a row at
 * perpendicular offset d.
 */
const rowOffset = (index, pitch) => (index - (ROWS.length - 1) / 2) * pitch;
const rowShift = (index, pitch) => BAND_TAN * rowOffset(index, pitch);

/**
 * THE STAGGER, AND IT IS MEANT TO BE BARELY THERE. The top and bottom rows give
 * up this much at each visible end and the middle row gives up none, so the three
 * are the same length bar a hair. It was a whole card once and then 32px; Ben:
 * "SLIGHTLY smaller, like slightly".
 *
 * It is an INSET ON THE MASK, not on the layout. Padding the row would change
 * its width, and the wrap that makes the loop seamless is computed from the item
 * count times the span — shortening the track would put a visible seam in the two
 * outer rows. Masking leaves the track exactly as long and stops drawing sooner.
 */
const STAGGER_PX = 24;
const isOuterRow = (index) => index === 0 || index === ROWS.length - 1;

/** Dead length at a row's left and right ends, in px, given its measured width. */
function rowInsets(index, rowWidth, pitch) {
  const base = ROW_CLIPPED_FRACTION * rowWidth + (isOuterRow(index) ? STAGGER_PX : 0);
  return { left: base + rowShift(index, pitch), right: base - rowShift(index, pitch) };
}

/** Fades one row out along its own direction of travel. */
function rowFade(index, pitch) {
  const bite = isOuterRow(index) ? STAGGER_PX : 0;
  const left = rowShift(index, pitch) + bite;
  const right = -rowShift(index, pitch) + bite;
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
 * IT IS ARITHMETIC RATHER THAN HIT-TESTING because on a desktop the ribbon is
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
 *      top and bottom rows by exactly the amount they gave up.
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
function rowAtPoint(clientX, clientY, box, band, m) {
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
  const t = -BAND_RAD;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const width = band.offsetWidth;
  const height = band.offsetHeight;

  // 2. Top of the first row to the bottom of the last, gaps included.
  if (Math.abs(localY) > height / 2) return -1;

  const fromTop = localY + height / 2;
  let index = Math.min(ROWS.length - 1, Math.max(0, Math.floor(fromTop / m.pitch)));
  const withinRow = fromTop - index * m.pitch;
  if (withinRow > m.cardH && index + 1 < ROWS.length) {
    const toNextRow = m.pitch - withinRow;
    if (toNextRow < withinRow - m.cardH) index += 1;
  }

  // 1b + 3. The row mask, along the rotated row, inset by the stagger.
  const rowX = localX + width / 2;
  const dead = rowInsets(index, width, m.pitch);
  if (rowX < dead.left + ROW_FADE_PX) return -1;
  if (rowX > width - dead.right - ROW_FADE_PX) return -1;

  return index;
}

/**
 * HOW LONG A ROW TAKES TO STOP, in milliseconds of e-folding.
 *
 * Ben: "when the user presses to stop a card it should smoothly stop". The drift
 * used to be a hard branch — paused or not — so a row went from 58px/s to nothing
 * between two frames, and the eye reads an instant stop as a dropped frame rather
 * than as a response. The gate below is a first-order lag on the same branch: the
 * row still stops because you touched it, it just takes a fifth of a second to
 * mean it, and it comes back the same way.
 */
const GATE_TAU = 190;

function Ribbon({ items, speed, direction, index, paused, register, reduceMotion, sale, m, fit, bandWidth }) {
  const baseX = useMotionValue(0);
  const rowRef = useRef(null);

  /*
   * ONE COPY OF THE STRIP MUST BE AT LEAST AS WIDE AS THE BAND, or the loop
   * shows its own end.
   *
   * The track is the strip twice over, translated by wrap(-half, 0, x) where
   * half is one copy. At the moment before it wraps the two copies cover
   * [-half, +half] of a row that is [0, bandWidth] — so anything past `half` is
   * empty. Nine 204px cards cleared a 1696px band with 140px to spare, which is
   * why this was never needed. Fitting the cards to the hero took the span to
   * 128px, one copy to 1152px, and opened a 544px hole that rotates into the
   * visible window every twenty seconds.
   *
   * A published catalogue of two photographs would have done the same thing at
   * any card size, so this is not only about the fit.
   *
   * Repeating the LIST rather than adding a third copy of the track keeps the
   * sale card at one per row: the slot is taken modulo the repeated strip, not
   * modulo the original nine.
   */
  const strip = useMemo(() => {
    if (!items.length) return items;
    const need = Math.max(1, Math.ceil(bandWidth / (items.length * m.span)));
    if (need === 1) return items;
    return Array.from({ length: need * items.length }, (_, j) => items[j % items.length]);
  }, [items, bandWidth, m.span]);

  /*
   * WHICH CARD THE SALE REPLACES: EVENLY SPACED, ONE PER ROW. Ben: "one per
   * row, staggered evenly". The three rows take their sale card a third of the
   * strip apart, so they never line up into a stripe down the ribbon and never
   * bunch into one corner of it either.
   *
   * It replaced a Math.random() slot, and evenly spaced is better than random
   * for a reason beyond the look: random meant two builds of one commit could
   * differ, which is the thing the prerender crawl exists to prevent. This is a
   * pure function of the row index and cannot drift.
   *
   * The rows are also rotated relative to each other (see `items` in the
   * parent) and run at three different speeds in two directions, so the even
   * start spreads rather than marching in step.
   */
  const saleSlot = strip.length ? Math.round((index * strip.length) / ROWS.length) % strip.length : 0;

  /*
   * THE SALE CARD IS TWO PHOTOGRAPHS WIDE, so the track is no longer a grid of
   * equal cells and the wrap cannot be items.length * span any more. This table
   * is the x of every card in the doubled list, and its last entry — the x where
   * the second copy would start — IS the wrap period. Deriving both from one
   * table is what keeps the seam invisible: a period computed separately from
   * the layout is a period that will disagree with it the first time either
   * changes.
   */
  const saleW = m.cardW * 2 + m.gap;
  const offsets = useMemo(() => {
    const out = [];
    let x = 0;
    for (let j = 0; j < strip.length * 2; j++) {
      out.push(x);
      x += (sale && j % strip.length === saleSlot ? saleW : m.cardW) + m.gap;
    }
    out.push(x);
    return out;
  }, [strip.length, m.cardW, m.gap, sale, saleSlot, saleW]);

  /*
   * WHICH COPY OF THE SALE CARD, IF EITHER, IS CLICKABLE.
   *
   * The card carries a link and a copy button, and the mask makes cards
   * invisible WITHOUT making them untouchable — the same property that forced
   * rowAtPoint to be arithmetic rather than hit-testing. A See More button
   * sitting in a row's fade would be an invisible click target, which is worse
   * than a dead one. So the card's pointer events are switched on only while it
   * is wholly inside that row's unfaded window, computed from the same insets
   * the mask itself is drawn from.
   *
   * At most one of the two copies can qualify: they are a wrap period apart and
   * the period is longer than the window.
   */
  const [liveSale, setLiveSale] = useState(-1);
  const liveRef = useRef(-1);

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
  // row is under it, through the callbacks registered here.
  //
  // The wheel goes through a spring and a DRAG DOES NOT. A wheel arrives as a
  // handful of large jumps and wants smoothing; a finger arrives every frame and
  // is already smooth, and a spring between it and the cards reads as the ribbon
  // being dragged through treacle.
  const nudgeRaw = useMotionValue(0);
  const nudge = useSpring(nudgeRaw, { damping: 40, stiffness: 220, mass: 0.6 });
  useEffect(
    () =>
      register(index, {
        nudge: (delta) => nudgeRaw.set(nudgeRaw.get() + delta),
        dragBy: (delta) => baseX.set(baseX.get() + delta),
      }),
    [index, register, nudgeRaw, baseX]
  );

  // Read through a ref inside the frame loop: useAnimationFrame holds the
  // callback it was given, so a prop read directly would be the value from the
  // render that installed it.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const gate = useRef(1);

  // Two copies of the list, wrapped over exactly one copy's width, so the seam
  // is never visible and the loop needs no measurement of the DOM.
  const half = offsets[strip.length];
  const x = useTransform(baseX, (v) => `${wrap(-half, 0, v)}px`);

  const lastNudge = useRef(0);

  useAnimationFrame((_t, delta) => {
    // THE DRIFT IS SKIPPED UNDER REDUCED MOTION; THE LIVENESS CHECK BELOW IS NOT.
    // It used to be one early return covering both, which left the sale card's
    // See More and copy button permanently pointer-events:none for anyone who
    // asks their system not to animate — a still ribbon whose one control was
    // dead. A stationary row still has to answer where its sale card is.
    if (!reduceMotion) {
      drift(delta);
    }

    if (!sale) return;
    const rowWidth = rowRef.current?.offsetWidth ?? 0;
    if (!rowWidth) return;
    const dead = rowInsets(index, rowWidth, m.pitch);
    const from = dead.left + ROW_FADE_PX;
    const to = rowWidth - dead.right - ROW_FADE_PX;
    const shift = wrap(-half, 0, baseX.get());
    let live = -1;
    for (const j of [saleSlot, saleSlot + strip.length]) {
      const left = offsets[j] + shift;
      if (left >= from && left + saleW <= to) { live = j; break; }
    }
    // Only on a change: this runs every frame and setState every frame would
    // re-render the row sixty times a second to say the same thing.
    if (live !== liveRef.current) {
      liveRef.current = live;
      setLiveSale(live);
    }
  });

  function drift(delta) {
    // Hovering, pressing or dragging a card stops THAT row and nothing else,
    // which is the point of it: the drift is what makes a card hard to look at,
    // and stopping every row would read as the whole thing breaking rather than
    // as one row waiting. (A TAP on a touch screen is the exception, and it is
    // the parent that widens it to all three.)
    const target = pausedRef.current ? 0 : 1;
    gate.current += (target - gate.current) * (1 - Math.exp(-delta / GATE_TAU));

    let moveBy = direction * speed * (delta / 1000) * gate.current;
    // Scroll velocity scales the drift rather than adding to it, so a flick
    // accelerates the ribbon in the direction it is already going instead of
    // fighting it, and a hard enough flick reverses it.
    moveBy += moveBy * velocityFactor.get();

    // The wheel keeps working while a row is stopped — stopping the drift is what
    // makes scrubbing it by hand useful in the first place.
    const nudged = nudge.get();
    moveBy += nudged - lastNudge.current;
    lastNudge.current = nudged;

    baseX.set(baseX.get() + moveBy);
  }

  const fade = rowFade(index, m.pitch);

  return (
    <div ref={rowRef} className="overflow-hidden" style={{ maskImage: fade, WebkitMaskImage: fade }}>
      <motion.div className="flex" style={{ x, gap: m.gap, skewX: reduceMotion ? 0 : skew }}>
        {[...strip, ...strip].map((item, i) => {
          // The list is doubled so the loop is seamless, so the slot matches
          // twice — once per copy. That is right: the ribbon is one repeating
          // strip and the sale should appear once per pass, not once ever.
          const isSaleSlot = sale && i % strip.length === saleSlot;
          /*
           * ONE COPY IS READ ALOUD, and it is always the first — not whichever
           * is on screen. Liveness changes every twenty seconds or so as the
           * row drifts, and an element that leaves and re-enters the
           * accessibility tree on a timer is a worse experience than one that
           * is simply there. The photographs are hidden from it entirely: six
           * repeats of the same nine images would otherwise be read out before
           * a screen reader reached the headline.
           */
          const announced = isSaleSlot && i < strip.length;
          return (
            <div
              key={`${item.id}-${i}`}
              aria-hidden={announced ? undefined : "true"}
              className="shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              style={{
                width: isSaleSlot ? saleW : m.cardW,
                height: m.cardH,
                pointerEvents: isSaleSlot && i === liveSale ? "auto" : "none",
              }}
            >
              {isSaleSlot ? (
                <HeroSaleCard sale={sale} scale={fit} />
              ) : (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/** Past this much travel a press is a drag and not a tap. */
const TAP_SLOP = 8;
/** And past this much it has committed to one axis or the other. */
const AXIS_SLOP = 6;

export default function HeroCardRibbon({ items, sales = [] }) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef(null);
  const bandRef = useRef(null);
  const pushers = useRef([]);
  const [hovered, setHovered] = useState(-1);
  const [dragRow, setDragRow] = useState(-1);
  /*
   * TAP TO STOP ALL THREE, tap again to start them, and only on a touch screen.
   * Ben's rule for a phone, and it is the right one there for a reason a mouse
   * does not have: a finger has no hover, so the per-row stop that a desktop
   * gets for free by pointing at a row has no equivalent, and a tap that stopped
   * only the row under the thumb would leave the other two moving under the same
   * finger. A mouse keeps hover and never sees this.
   */
  const [frozen, setFrozen] = useState(false);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const fit = useMemo(() => fitFor(box.w, box.h), [box]);
  const m = useMemo(() => metricsFor(fit), [fit]);
  // The band is BAND_WIDTH_RATIO of the box, which is what a row has to fill.
  const bandWidth = box.w * BAND_WIDTH_RATIO;
  const mRef = useRef(m);
  mRef.current = m;

  const register = useCallback((index, push) => {
    pushers.current[index] = push;
  }, []);

  /*
   * MEASURE THE BOX, THEN SIZE THE CARDS TO IT. See fitFor: this is what makes
   * the three rows end on the same two lines instead of drifting 136px apart.
   *
   * useLayoutEffect and a ResizeObserver rather than a window resize listener,
   * because the box is a percentage of the hero and changes size when the hero
   * does — which includes the phone's address bar sliding away, an event that
   * fires no resize on some browsers.
   */
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const measure = () =>
      setBox((was) =>
        was.w === box.clientWidth && was.h === box.clientHeight
          ? was
          : { w: box.clientWidth, h: box.clientHeight }
      );
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  /*
   * THE WHEEL OVER A ROW MOVES THAT ROW, AND THE PAGE STAYS PUT. Ben's ask,
   * twice: first that the window not scroll over the cards, then that it work
   * per-row. It is a window listener rather than a handler on the ribbon because
   * on a desktop the ribbon is pointer-events:none and must stay that way — six
   * repeats of the same photographs must never swallow a click meant for the
   * CTA, and the mask makes cards invisible without making them untouchable, so
   * an unseen card would be the one catching it. A wheel event over a
   * pointer-events:none element is delivered to whatever is underneath, so there
   * is nothing to bind to anyway.
   *
   * NOT CAPTURED BETWEEN THE ROWS. rowAtPoint returns -1 in the gaps and off the
   * band, and the page scrolls normally there — which is what keeps a
   * full-height hero from trapping a visitor whose cursor happens to be on the
   * right-hand side.
   *
   * passive:false is required. Chrome makes wheel listeners passive by default,
   * a passive listener cannot preventDefault, and without it the page scrolls
   * anyway and the whole thing silently does nothing.
   */
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (typeof window === "undefined") return undefined;
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;

    const onWheel = (event) => {
      const index = rowAtPoint(event.clientX, event.clientY, boxRef.current, bandRef.current, mRef.current);
      if (index < 0) return;
      event.preventDefault();
      // The sign is applied here rather than inside the row, because a drag has
      // to move the cards WITH the finger whichever way the row happens to run
      // and a wheel has to move them along it.
      pushers.current[index]?.nudge(event.deltaY * ROWS[index].direction);
    };
    const onLeave = () => setHovered(-1);

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  /*
   * DRAGGING, on a mouse and on a finger alike — Ben: "the cards should be
   * draggable on mobile AND on desktop".
   *
   * THE DRAG IS PROJECTED ONTO THE ROW, not taken from clientX. The rows run at
   * 22 degrees, so a pointer moved straight right along a row's own direction
   * has travelled further than its horizontal displacement, and using dx alone
   * would leave the cards lagging the finger by 7% and sliding out from under it
   * on any diagonal stroke.
   *
   * AND IT COMMITS TO AN AXIS ONCE. Below AXIS_SLOP nothing is decided; past it,
   * a stroke that is mostly ALONG a row grabs the ribbon and a stroke that is
   * mostly ACROSS one is handed back to the page so a phone can still scroll
   * past the band. Deciding this every frame instead would let a wobbly finger
   * flicker between the two.
   *
   * WHY IT IGNORES A PRESS THAT LANDS ON A CONTROL. The catalog button sits
   * inside the ribbon's box on a desktop, above it, with its own pointer events.
   * Starting a drag from a press on it would swallow the click.
   */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const drag = { active: false, id: -1, index: -1, x: 0, y: 0, u: 0, moved: 0, axis: null, touch: false };

    const release = () => {
      if (drag.axis === "row") document.body.style.userSelect = "";
      drag.active = false;
      drag.axis = null;
      drag.id = -1;
      setDragRow(-1);
    };

    const onDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      if (event.target?.closest?.("a,button,input,textarea,select,label,[role='button']")) return;
      const index = rowAtPoint(event.clientX, event.clientY, boxRef.current, bandRef.current, mRef.current);
      if (index < 0) return;
      Object.assign(drag, {
        active: true,
        id: event.pointerId,
        index,
        x: event.clientX,
        y: event.clientY,
        u: 0,
        moved: 0,
        axis: null,
        touch: event.pointerType !== "mouse",
      });
      // Pressing stops the row under the pointer. The gate makes it ease out
      // rather than stop dead.
      setDragRow(index);
    };

    const onMove = (event) => {
      if (event.pointerType === "mouse" && !drag.active) {
        setHovered(rowAtPoint(event.clientX, event.clientY, boxRef.current, bandRef.current, mRef.current));
      }
      if (!drag.active || event.pointerId !== drag.id) return;

      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));

      if (!drag.axis) {
        if (drag.moved < AXIS_SLOP) return;
        const along = Math.abs(dx * ALONG_X + dy * ALONG_Y);
        const across = Math.abs(dx * -ALONG_Y + dy * ALONG_X);
        if (along < across) {
          // Across the rows: this stroke belongs to the page.
          release();
          return;
        }
        drag.axis = "row";
        document.body.style.userSelect = "none";
      }

      const u = dx * ALONG_X + dy * ALONG_Y;
      pushers.current[drag.index]?.dragBy(u - drag.u);
      drag.u = u;
    };

    const onUp = (event) => {
      if (!drag.active || event.pointerId !== drag.id) return;
      // A press that never went anywhere, on a screen with no hover, is the tap
      // that stops all three. A mouse has hover and does not need it — and a
      // click on the ribbon must stay a click on whatever is under it.
      if (drag.touch && drag.moved <= TAP_SLOP) setFrozen((was) => !was);
      release();
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (drag.axis === "row") document.body.style.userSelect = "";
    };
  }, []);

  if (!items?.length) return null;

  return (
    /*
     * NO aria-hidden ON THE BOX ANY MORE, and that is the sale card's doing.
     * Hiding the whole ribbon was right when it was six repeats of nine
     * photographs; it is wrong now that one card in each row carries a link and
     * a button, because aria-hidden on an ancestor removes its descendants from
     * the accessibility tree unconditionally and an unreachable control is a
     * defect, not a decoration. The attribute moved down to the cards: every
     * photograph carries it, and so does the second copy of each sale card.
     *
     * data-hero-ribbon is the handle the screenshot and region probes use to
     * find this element. They keyed off aria-hidden until the attribute moved,
     * which made an accessibility decision load-bearing for the tooling.
     *
     * WHERE IT SITS, AND IT IS TWO DIFFERENT THINGS. On a phone it is a band of
     * its own in the flow, under the copy, at full strength — Ben: "on mobile
     * phones the scrolling hero should be in an extended graphic section and
     * appear below the hero text". Behind the copy at 25% it was neither
     * readable as an image nor invisible enough to ignore. From md up it goes
     * back to being the hero's right-hand asset, absolutely placed beside the
     * type.
     *
     * pointer-events follow the same split. On a phone the band has nothing
     * underneath it, so it takes its own touches and can therefore declare
     * touch-action: pan-y — which is what lets a horizontal drag move the cards
     * while a vertical one still scrolls the page. On a desktop it is over the
     * hero copy and the CTA, so it must not take events at all; the window
     * listeners above handle it there.
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
     */
    <div
      ref={boxRef}
      data-hero-ribbon=""
      className="relative z-0 h-[68vh] min-h-[24rem] w-full touch-pan-y overflow-hidden opacity-100 md:pointer-events-none md:absolute md:inset-y-0 md:right-0 md:h-auto md:min-h-0 md:w-[62%] md:touch-auto md:opacity-25 lg:opacity-60 xl:opacity-100"
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
        <div className="flex flex-col" style={{ gap: m.gap }}>
          {ROWS.map((row, i) => (
            <Ribbon
              key={i}
              index={i}
              /* Offsetting the start of each row stops the three from lining up
                 into one visible column of edges. */
              items={[...items.slice(i), ...items.slice(0, i)]}
              speed={row.speed}
              direction={row.direction}
              paused={frozen || hovered === i || dragRow === i}
              register={register}
              reduceMotion={reduceMotion}
              m={m}
              fit={fit}
              bandWidth={bandWidth}
              /* One sale per row, cycling, so three rows and two sales show the
                 first sale twice rather than leaving a row without one. Empty
                 list means no sale cards at all, which is the state the site is
                 in whenever nothing is scheduled. */
              sale={sales.length ? sales[i % sales.length] : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
