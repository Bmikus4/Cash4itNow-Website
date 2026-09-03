# UI principles, as the site actually is

Measured from source at `8cc500a` (branch `lead-capture`), not from taste. Every count below
is a `grep` over `src/**/*.jsx` excluding `src/components/ui/` (the shadcn primitives), so the
numbers describe the site's own components, 43 files.

This file exists because the next round of work changes the Home page, the For Sale page and
the sales surface. Anything built after this must be indistinguishable from what is already
here, and "indistinguishable" needs numbers, not adjectives.

## 1. What the site is

A veteran-owned trade-services **poster**. Screen-printed signage, not editorial and not SaaS:
black ground, one red, condensed uppercase type at billboard scale, square corners, hairlines
where other sites put cards. The phone number is the product.

Three visual decisions carry the entire identity, and breaking any one of them is visible
immediately:

1. **Radius zero.** `--radius: 0rem`. 231 `border` utilities, 7 `rounded-full` (icon badges
   only), and **zero `shadow-*` in the whole site tree** save one `hover:shadow-lg`. Nothing
   floats; nothing is soft.
2. **One chromatic colour.** Accent crimson `hsl(0 85% 40%)`. Everything else is a greyscale
   ramp. There is no second hue anywhere on the page.
3. **Oswald, uppercase, heavy.** `font-heading` appears 258 times against `font-body` 3.
   `uppercase` 231 times. Body copy is deliberately small under enormous headings; that size
   contrast *is* the layout.

## 2. Tokens

The only source is `src/index.css`. `tailwind.config.js` maps them and adds nothing of its own
except `fontFamily` and the accordion keyframes.

| Token | Value | Reads as |
|---|---|---|
| `--foreground` | `0 0% 5%` | ink, off-black. Never `#000` |
| `--background` | `0 0% 100%` | paper |
| `--accent` | `0 85% 40%` | the red. The only hue |
| `--muted` | `0 0% 93%` fill / `0 0% 40%` text | grey band, secondary copy |
| `--border` `--input` | `0 0% 82%` | hairline |
| `--card` | `0 0% 97%` | barely used; cards here are borders, not fills |
| `--radius` | `0rem` | **the identity** |

Fonts: `--font-heading: Oswald` (400-700), `--font-body: Inter` (300-700).

Two dead entries worth knowing before you touch either file: `Black Han Sans` is in the
Google Fonts `@import` and used nowhere, and `--chart-4: 30 80% 40%` is the one non-red hue in
the palette and is referenced by nothing.

A `.dark` block exists and inverts `--primary` to the accent, but no code ever adds the class.
**The site is single-theme.** Contrast comes from alternating section bands instead (§4).

## 3. Type scale, as used

| Role | Classes | Count |
|---|---|---|
| Hero H1 | `font-heading font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-[0.9]` | 1 |
| Page H1 | `text-5xl md:text-7xl` + `leading-[0.9]` | per page |
| Section H2 | `font-heading font-black text-4xl md:text-6xl uppercase tracking-tight mb-2` | 5 |
| Sub-band H2 | `text-2xl md:text-3xl` or `text-3xl md:text-4xl` | 9 |
| Card H3 | `font-heading font-black text-base/text-xl uppercase tracking-tight leading-tight` | many |
| Kicker | `font-heading text-accent text-xs/text-sm uppercase tracking-widest` or `tracking-[0.3em]` | ~12 |
| Lead copy | `text-lg` `text-background/70` `leading-relaxed` | 49 |
| Body | `text-sm` (100) and `text-xs` (90) | dominant |

Tracking is a four-value system and it is keyed to size, not to mood: `tracking-tight` (61) on
anything `text-2xl` and up, `tracking-wide`/`wider` (30/29) on buttons and nav, and
`tracking-widest` (67) on small caps labels. No monospace anywhere, including for prices and
counts.

## 4. Structure: full-bleed alternating bands

`AppLayout` is the whole shell: `min-h-screen flex flex-col`, fixed `Navbar`, `main flex-1`,
`Footer`. No sidebar, no inset page container.

Every section is a **full-width colour band**, and the band colour alternates. Counted across
section openers: `bg-foreground` 13, `bg-background` 4, `bg-accent` 4, `bg-muted/40` 2. The
whole viewport width changes colour at each section boundary, and that switch is the page
rhythm. There is no "page on a card" anywhere in the site.

Inside a band, always the same two rules:

- `max-w-7xl mx-auto` (24 uses, 1280px) with `px-6 md:px-10` (53 / 42 uses).
- Narrower measures only for prose and forms: `max-w-3xl` / `max-w-4xl` / `max-w-5xl` for
  copy-only bands, `max-w-xl` / `max-w-2xl` / `max-w-md` for a form or a centred block.

Vertical rhythm is **two values and only two**:

- `py-14 md:py-20` (17 uses) for a normal band
- `py-16 md:py-24` (12 uses) for a major band
- one exception, `py-20 md:py-32`, on the single tallest band

A page (not the home page) opens with `pt-16` to clear the fixed nav, then a black header band
at `py-14 md:py-20` carrying kicker, H1, red rule, lead paragraph.

## 5. Framing: borders do all the work

- **Grids are one bordered block with internal dividers, never a row of cards.** The pattern is
  `grid ... gap-0 border border-background/20` on the wrapper and
  `border-b sm:border-r border-background/20` on each cell. 11 `gap-0` uses. Where cards do
  stand apart they use `gap-4`/`gap-6` and a hard `border-2`.
- **Border weight is the hierarchy:** `border` 1px (231), `border-2` (66) for a card or an
  outline button, `border-4` (4) to frame a photograph.
- **Border opacity is the depth system.** `border-foreground/10 /15 /20 /30` on light bands,
  `border-background/10 /20` on dark. This replaces shadow entirely; there is no elevation.
- **The red rule under a heading is the section-title signature.** `h-1.5 bg-accent w-24
  mx-auto mt-3` when the heading is centred (6 uses), `h-1 bg-accent w-16 mb-5` when it is
  left-aligned. The site labels sections with a rule *below* the title, not an eyebrow above,
  though a red `tracking-widest` kicker above it is also in the vocabulary.
- **Icon chips are solid red squares.** `w-12 h-12 bg-accent flex items-center justify-center`
  with a `w-6 h-6 text-white` glyph. Sizes seen: 8, 10, 12, 16. Square, never round.
- Lucide is the icon set, ~20px (`w-4 h-4` / `w-5 h-5`) in chrome, `w-6 h-6` in chips.
- The nav wears a `bg-accent h-1 w-full` strip on its very top edge.
- Photographs get `object-cover` plus `group-hover:scale-105 transition-transform duration-500`.
  That is the only hover treatment images get.

## 6. Positioning

**Navbar.** `fixed top-0 z-50 bg-foreground`, red 1px strip above, inner `max-w-7xl px-4
md:px-8`, `h-16 md:h-18` (64/72px). Brand wordmark left at `text-2xl md:text-3xl`, five links
`font-heading text-sm tracking-wider uppercase` with `gap-8`, then the favourites heart, then
the red phone button `bg-accent text-white px-5 py-2.5`. Active link is `text-accent`; idle is
`text-background/80`. Mobile is a full-screen black overlay with `text-4xl` stacked links,
staggered 0.07s.

**Hero.** `min-h-screen`, `pt-16`, `md:flex-row` 50/50. Copy left in `px-6 md:px-10 py-16
md:py-24` inside `max-w-2xl`; image right in a `border-4 border-background` box at `h-[55vh]
md:h-[68vh] max-w-xl`, with a solid `bg-accent` block behind it at `-z-10` that slides opposite
the pointer (spring 110/18/0.5, travel 30x22px) and a 90px red corner triangle built from
`border-t-[90px]`. Three stacked CTAs: red phone button `text-xl md:text-2xl`, outlined white
"Free Evaluation", outlined red "How We Get It Done".

**Footer.** Black. Opens with a full-width outlined wordmark: `text-[13vw] leading-none
text-transparent` with `WebkitTextStroke: 2px white`, clipped by `overflow-hidden`. Then a
`grid-cols-1 md:grid-cols-3 gap-10` block whose column heads are red `text-xs uppercase
tracking-widest` labels, then the newsletter, then copyright, each separated by `border-t
border-background/10 mt-10 pt-10`.

**The phone number is the primary CTA on every surface** and appears in the nav, the hero, the
footer and the CTA bands. `tel:4129697757`.

## 7. Motion

framer-motion in 23 of 43 site files. Two patterns, and nothing else:

- **Load-in**, above the fold only: `initial={{opacity:0, y:20|30}}` to `animate`, delays
  stepping 0.1 to 0.7.
- **Scroll reveal**, everywhere below: `whileInView` with `viewport={{once:true}}` and
  `transition={{delay: i * 0.05|0.08|0.1}}` for list stagger.

Two house rules that are invisible in the rendered page and will be "tidied up" by someone who
has not read them:

- `useReducedMotion()` is checked **per component**, not by a global blanket, so a component
  stays correct when it is moved to a page that has no blanket. `CategoryCardFan` documents why.
- **Any infinite animation must carry `data-loop-animation`.** The prerender crawl strips the
  inline `style` of those elements, which is what makes two builds of one commit byte-identical.
  The hero's bouncing arrow is the existing example.

Also load-bearing and easy to break: transforms that must be composed by framer rather than
written as a Tailwind class or a raw inline `transform`. Tailwind only emits CSS for *literal*
class strings, so a computed `rotate-[Ndeg]` silently produces nothing, and a raw inline
`transform` cannot be overridden by a Tailwind `rotate-0` on hover. `CategoryCardFan` carries
the full note.

And in the hero specifically: the parallax is **translation only**, deliberately. The
before/after slider inside maps drag position through `getBoundingClientRect`, and a rotate or
scale on any ancestor distorts that rect so the handle drifts from the pointer.

## 8. Invariants

Break these and the page stops looking like this site:

1. Radius 0. No `rounded-*` except a badge.
2. No shadows. Depth is a tinted hairline.
3. One accent, `hsl(0 85% 40%)`. No second hue, no gradient except the two `from-foreground/60`
   image scrims.
4. Oswald, uppercase, `font-black` for anything that is a heading.
5. Sections are full-bleed colour bands, alternating, `max-w-7xl px-6 md:px-10` inside.
6. Two vertical paddings: `py-14 md:py-20`, `py-16 md:py-24`.
7. A red rule under the section title, `h-1.5 w-24` centred or `h-1 w-16` left.
8. Multi-cell grids are one bordered block with `gap-0` internal dividers.
9. Motion is load-in above the fold and `whileInView once` below. Nothing loops without
   `data-loop-animation`.
10. The phone number is the primary CTA of every surface.

## 9. Defects found while measuring

Recorded here because each one bears on the Home page rework and none should be re-discovered.

- **`ServicesSection.jsx` is dead code and it collides with a live anchor.** It is imported by
  nothing (the greps that appear to find it are matching `PropertyServicesSection`). It declares
  `id="services"`, and so does `HowItWorksSection`, which *is* on Home. The hero's third CTA
  points at `#services` and therefore lands on `HowItWorksSection`. `ServicesSection` is where
  the flyer banner strip and the "Hundreds of Categories, We Buy It All" overlay live, so it is
  probably the thing being remembered as the "items we sell image".
- **The flyer has already been converted to text once.** `CategoryCardFan` replaced it on
  2026-08-11 because every category name in that `.webp` was pixels, and `CategoriesPreview`
  carries an explicit instruction not to put the image back in its place. The flyer now sits
  below the cards, captioned "The original flyer". `src/content/categories.js` is the single
  source for that list and for the `OfferCatalog` JSON-LD.
- **`fetchInventory()` returns `[]`.** There is no public inventory endpoint; the For Sale page
  and Saved Items render empty states by design, and `inventoryClient.js` is the one seam where
  a real endpoint lands. Any "Store" page is a UI over no data until that endpoint exists.
- `Black Han Sans` is downloaded on every page load and never used.
