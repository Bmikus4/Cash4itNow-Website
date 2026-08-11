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
 * The `image`/`collage*` flags are presentational and belong to the /categories
 * layout. They are kept here rather than split out because splitting them would
 * mean a second file keyed by title — the same two-lists problem in a new shape.
 */
export const CATEGORIES = [
  {
    title: "Records, CDs, Guitars & Music Memorabilia",
    items: ["Vinyl Records", "CDs", "Electric Guitars", "Acoustic Guitars", "Signed Memorabilia", "Old Cassettes", "Jukeboxes"],
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
  },
  {
    title: "Tonka, Matchbox, GI Joe, Atari, Nintendo & Pedal Cars",
    items: ["Tonka Trucks", "Matchbox Cars", "GI Joe", "Atari", "Nintendo", "Pedal Cars", "Steel Toys", "Toy Boats", "Wagons"],
    collage: true,
  },
  {
    title: "Uniforms, Medals, Military Artifacts & Swords",
    items: ["Military Uniforms", "Medals", "Swords", "Historical Artifacts", "Cap Guns", "Shell Boxes", "Decoys", "Military Memorabilia"],
    image: "/img/fddd29a83_generated_image.webp",
  },
  {
    title: "Fine Jewelry & Vintage Costume Jewelry",
    items: ["Fine Jewelry", "Turquoise Jewelry", "Vintage Costume Jewelry", "Weiss", "Trifari", "Miriam Haskell", "Rhinestone Pieces", "Brooches", "Necklaces"],
    image: "/img/f3522ea84_generated_image.webp",
  },
  {
    title: "Signs & Advertising",
    items: ["Advertising Signs", "Old Signs", "Oil Cans", "Pop Bottles"],
    image: "/img/6414adcb0_Screenshot_20260527_201908_Instagram.webp",
  },
  {
    title: "Sports & Cards",
    items: ["Old Baseball Cards", "Early Star Wars", "Early Boy Scouts", "Bicycles"],
    collage6: true,
  },
  {
    title: "Home & Décor",
    items: ["Pottery", "Crocks", "Jugs", "Old Bowls", "Chairs", "Rugs", "Lamps", "Lighting", "Trunks", "Oil Paintings", "Weathervanes", "Doorstops", "Wagon Wheels", "Griswold Cast Iron"],
    collage7: true,
  },
  {
    title: "Smoking Pipes & Fountain Pens",
    items: ["Meerschaum Pipes", "Briar Pipes", "Clay Pipes", "Carved Pipes", "Pipe Stands", "Fountain Pens", "Parker Pens", "Waterman Pens", "Sheaffer Pens", "Montblanc", "Ink Bottles", "Pen Sets"],
    collage8: true,
  },
  {
    title: "Uranium Glass & Vaseline Glass",
    items: ["Uranium Glass", "Vaseline Glass", "Depression Glass", "UV Glowing Pieces", "Antique Glassware", "Bowls", "Plates", "Cups", "Figurines"],
    collage9: true,
  },
  {
    title: "Americana",
    items: ["American Flags", "Uncle Sam Tins", "Patriotic Eagles", "Route 66 Signs", "Statue of Liberty Souvenirs", "4th of July Decor", "Political Buttons", "Patriotic Ribbons", "Liberty Bells", "Vintage Postcards", "Patriotic Toys", "Presidential Items"],
    image: "/img/4fd36c129_generated_image.webp",
  },
];

/** Named on /categories under "and plenty more", outside the ten headings. */
export const ADDITIONAL_ITEMS = [
  "Turquoise", "Old Christmas", "Early Halloween", "Religious Items",
  "Old Fishing Gear", "70s Tech", "Railroad", "Trains", "Cameras",
  "Taxidermy", "Pinball", "Griswold Cast Iron", "Grocery Items",
];
