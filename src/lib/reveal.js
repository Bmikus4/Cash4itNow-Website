/*
 * THE SCROLL-IN REVEAL, run by the compositor.
 *
 * Every section on the site rose into view with framer's `y`, and framer animates `y` from
 * JavaScript, a transform written on every frame for every element entering at once. Scrolling Home
 * top to bottom for the first time held a 4x-slowed phone's main thread at 97%, against 58% for the
 * same scroll once everything had revealed (2026-10-22). A `transform` string is something framer
 * hands to a Web Animation instead, which the compositor runs.
 *
 * THE MOTION IS UNCHANGED. With no duration given, framer moved `y` on its default spring and
 * opacity on its default 0.3s ease, and both are restated here. With a duration, the one tween
 * applies to both, as it did.
 *
 * `transitionEnd` puts `transform: none` back. A transform left at translateY(0px) is still a
 * transform, and it makes the element the containing block of anything position:fixed inside it: a
 * modal opened from a revealed card would be pinned inside the card. `y: 0` ended at none, so this
 * must too.
 */
const SPRING = { type: "spring", stiffness: 500, damping: 25, restSpeed: 10 };
const EASE = { type: "keyframes", ease: [0.25, 0.1, 0.35, 1], duration: 0.3 };

/**
 * @param {{ y?: number, delay?: number, duration?: number, margin?: string }} [options]
 * @returns {import("framer-motion").MotionProps}
 */
export function reveal({ y = 20, delay = 0, duration, margin } = {}) {
  return {
    initial: { opacity: 0, transform: `translateY(${y}px)` },
    whileInView: { opacity: 1, transform: "translateY(0px)", transitionEnd: { transform: "none" } },
    viewport: margin ? { once: true, margin } : { once: true },
    transition: duration ? { duration, delay } : { delay, opacity: EASE, transform: SPRING },
  };
}
