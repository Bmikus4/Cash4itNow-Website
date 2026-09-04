import React from "react";

/**
 * "Cash 4 It Now", with the 4 in the accent red.
 *
 * WHY A COMPONENT FOR SIX WORDS. The name is rendered as a display element in
 * three places that must agree — the navbar on every page, the hero headline,
 * and the giant outlined wordmark in the footer — and Ben's "the 4 in cash 4 it
 * now should be bold and red" is a rule about the NAME, not about one of those
 * three. Spelling it out three times is how one of them ends up with a white 4
 * after somebody edits the other two, and the discipline this repo already
 * applies to the category list and to origins says the same thing here: one
 * spelling, one file.
 *
 * IT DOES NOT SET ITS OWN SIZE, WEIGHT OR CASE. Each site keeps its own —
 * text-3xl in the nav, text-8xl in the hero, 13vw and uppercase in the footer —
 * so this takes a className and adds nothing but the accent on the digit.
 *
 * `accentStyle` exists for the footer alone, where the wordmark is transparent
 * text with a white -webkit-text-stroke. A red FILL is invisible there because
 * the fill is what has been turned off; the stroke has to be recoloured instead,
 * and only that caller knows its stroke width.
 */
export default function Wordmark({ className = "", accentStyle }) {
  return (
    <span className={className}>
      Cash{" "}
      <span className="text-accent font-black" style={accentStyle}>
        4
      </span>{" "}
      It Now
    </span>
  );
}
