/**
 * What the business buys. THIS IS THE ONLY CATEGORY LIST — `/categories`
 * renders it, the homepage's What We Buy fan renders it, and the OfferCatalog
 * JSON-LD is built from it.
 *
 * It was a local const in src/pages/Categories.jsx until the homepage needed the
 * same names as real text. Copying it would have been the defect this repo keeps
 * paying for: two lists, one edited, and a site that says two different things
 * about what it accepts on two different pages.
 *
 * NOTHING HERE MAY BE INVENTED. A list of what a business buys is a factual
 * claim about that business — the same class as a price. Every name below was
 * already published on /categories as text before this file existed; moving it
 * changed nothing about what the site claims. A new category comes from Ben or
 * from the flyer's own wording, never from what seems likely to sell.
 *
 * CLOCKS and WATCHES were added on Ben's word, 2026-08-11 ("yes we buy clocks
 * and watches, add them"), after the flyer was found to list CLOCKS while the
 * site named it nowhere. They went into the two existing categories rather than
 * into a new one BECAUSE a new "Clocks & Watches" heading would have carried two
 * items where the others carry four to fifteen — and the only way to make it
 * look like the rest would have been to invent pocket watches, mantel clocks and
 * makers nobody has confirmed. Thin-and-true beat full-and-invented.
 *
 * The `image`/`collage*` flags are presentational and belong to the /categories
 * layout. They are kept here rather than split out because splitting them would
 * mean a second file keyed by title — the same two-lists problem in a new shape.
 *
 * `cardImage` is the ONE image for the home page's What We Buy card, added
 * 2026-09-03 on Ben's "add images to the home what we buy section, the default
 * ones". It exists because `image` does not cover every category: five of the ten
 * are rendered on /categories as multi-image collages built from literals in
 * Categories.jsx, so they have no single picture to borrow. cardImage names one,
 * and for those five it is a photograph already published on /categories under
 * that same heading — nothing new was sourced and nothing was invented.
 *
 * It lives here for the reason the paragraph above gives: the alternative is a
 * second map keyed by title, which is the two-lists defect in a new shape.
 */
export const CATEGORIES = [
  {
    title: "Records, CDs, Guitars & Music Memorabilia",
    items: ["Vinyl Records", "CDs", "Electric Guitars", "Acoustic Guitars", "Signed Memorabilia", "Old Cassettes", "Jukeboxes"],
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
    cardImage: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
  },
  {
    title: "Tonka, Matchbox, GI Joe, Atari, Nintendo & Pedal Cars",
    items: ["Tonka Trucks", "Matchbox Cars", "GI Joe", "Atari", "Nintendo", "Pedal Cars", "Steel Toys", "Toy Boats", "Wagons"],
    collage: true,
    cardImage: "/img/3065f1e9c_generated_image.webp",
  },
  {
    title: "Uniforms, Medals, Military Artifacts & Swords",
    items: ["Military Uniforms", "Medals", "Swords", "Historical Artifacts", "Cap Guns", "Shell Boxes", "Decoys", "Military Memorabilia"],
    image: "/img/fddd29a83_generated_image.webp",
    cardImage: "/img/fddd29a83_generated_image.webp",
  },
  {
    // Title extended to name watches. The other titles either enumerate what is
    // under them or are broad enough to cover it; this one enumerates, so an
    // unnamed Watches would be a claim a reader scanning headings never finds.
    title: "Fine Jewelry, Watches & Vintage Costume Jewelry",
    items: ["Fine Jewelry", "Watches", "Turquoise Jewelry", "Vintage Costume Jewelry", "Weiss", "Trifari", "Miriam Haskell", "Rhinestone Pieces", "Brooches", "Necklaces"],
    image: "/img/f3522ea84_generated_image.webp",
    cardImage: "/img/f3522ea84_generated_image.webp",
  },
  {
    title: "Signs & Advertising",
    items: ["Advertising Signs", "Old Signs", "Oil Cans", "Pop Bottles"],
    image: "/img/6414adcb0_Screenshot_20260527_201908_Instagram.webp",
    cardImage: "/img/6414adcb0_Screenshot_20260527_201908_Instagram.webp",
  },
  {
    title: "Sports & Cards",
    items: ["Old Baseball Cards", "Early Star Wars", "Early Boy Scouts", "Bicycles"],
    collage6: true,
    cardImage: "/img/b72c0acb4_generated_image.webp",
  },
  {
    title: "Home & Décor",
    items: ["Pottery", "Crocks", "Jugs", "Old Bowls", "Chairs", "Rugs", "Lamps", "Lighting", "Clocks", "Trunks", "Oil Paintings", "Weathervanes", "Doorstops", "Wagon Wheels", "Griswold Cast Iron"],
    collage7: true,
    cardImage: "/img/2ac325373_generated_image.webp",
  },
  {
    title: "Smoking Pipes & Fountain Pens",
    items: ["Meerschaum Pipes", "Briar Pipes", "Clay Pipes", "Carved Pipes", "Pipe Stands", "Fountain Pens", "Parker Pens", "Waterman Pens", "Sheaffer Pens", "Montblanc", "Ink Bottles", "Pen Sets"],
    collage8: true,
    cardImage: "/img/ac93609f7_generated_image.webp",
  },
  {
    title: "Uranium Glass & Vaseline Glass",
    items: ["Uranium Glass", "Vaseline Glass", "Depression Glass", "UV Glowing Pieces", "Antique Glassware", "Bowls", "Plates", "Cups", "Figurines"],
    collage9: true,
    cardImage: "/img/2f04db7ab_generated_image.webp",
  },
  {
    title: "Americana",
    items: ["American Flags", "Uncle Sam Tins", "Patriotic Eagles", "Route 66 Signs", "Statue of Liberty Souvenirs", "4th of July Decor", "Political Buttons", "Patriotic Ribbons", "Liberty Bells", "Vintage Postcards", "Patriotic Toys", "Presidential Items"],
    image: "/img/4fd36c129_generated_image.webp",
    cardImage: "/img/4fd36c129_generated_image.webp",
  },
];

/** Named on /categories under "and plenty more", outside the ten headings. */
export const ADDITIONAL_ITEMS = [
  "Turquoise", "Old Christmas", "Early Halloween", "Religious Items",
  "Old Fishing Gear", "70s Tech", "Railroad", "Trains", "Cameras",
  "Taxidermy", "Pinball", "Griswold Cast Iron", "Grocery Items",
];
