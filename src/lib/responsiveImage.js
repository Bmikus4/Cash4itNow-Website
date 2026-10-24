import VARIANTS from "@/content/imgVariants.json";

/*
 * SRCSET FOR THE SITE'S OWN PHOTOGRAPHS, from the copies scripts/img-variants.py makes.
 *
 * Anything that is not a file in public/img (a catalogue photograph from the platform, a URL with a
 * query) gets no srcset and loads as it always did. The original is always the last candidate, so a
 * screen that needs more than the largest copy still gets every pixel the file has.
 *
 * `sizes` is the caller's, because only the caller knows its layout, and it must be the width the
 * photograph is DRAWN at, not the box's: under object-cover a square photograph in a portrait box is
 * drawn as wide as the box is tall. coverSizes() does that sum for a box of fixed size.
 */

const nameOf = (src) => /^\/img\/([^/?#]+)$/.exec(src || "")?.[1] ?? null;

export function srcSetOf(src) {
  const name = nameOf(src);
  const v = name && VARIANTS[name];
  if (!v || !v.widths.length) return undefined;
  const stem = name.replace(/\.[^.]+$/, "");
  return [...v.widths.map((w) => `/img/${w}/${stem}.webp ${w}w`), `${src} ${v.w}w`].join(", ");
}

/** The `sizes` for a photograph covering a fixed box of boxW x boxH CSS pixels. */
export function coverSizes(src, boxW, boxH) {
  const name = nameOf(src);
  const v = name && VARIANTS[name];
  if (!v) return undefined;
  return `${Math.ceil(Math.max(boxW, (boxH * v.w) / v.h))}px`;
}
