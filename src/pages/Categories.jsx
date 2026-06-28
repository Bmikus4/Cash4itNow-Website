import React from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

const ORIGINAL_FLYER = "/img/14dc69cc4_Screenshot_20260524_215817_Facebook.webp";

const categories = [
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

const additionalItems = [
  "Turquoise", "Old Christmas", "Early Halloween", "Religious Items",
  "Old Fishing Gear", "70s Tech", "Railroad", "Trains", "Cameras",
  "Taxidermy", "Pinball", "Griswold Cast Iron", "Grocery Items",
];

export default function Categories() {
  return (
    <div className="pt-16 bg-background">
      {/* Header with original flyer */}
      <section className="bg-foreground">
        <div className="relative h-40 md:h-52 overflow-hidden">
          <img src={ORIGINAL_FLYER} alt="Items we buy" className="w-full h-full object-cover object-top opacity-40" />
          <div className="absolute inset-0 bg-foreground/60" />
          <div className="absolute inset-0 flex items-end px-6 md:px-10 pb-0 max-w-7xl mx-auto">
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">Cash 4 It Now</p>
            <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
              What We Buy
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-4" />
            <p className="text-background/70 text-lg max-w-xl">
              If it's old, interesting, or collectible — we want it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto space-y-0 border border-foreground">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} border-b border-foreground last:border-b-0`}
            >
              <div className="w-full md:w-2/5 overflow-hidden">
                {cat.collage ? (
                  <div className="w-full h-56 md:h-80 overflow-hidden">
                    <img src="/img/3065f1e9c_generated_image.webp" alt="Vintage Tonka Truck, Matchbox Car, GI Joe, Pedal Car, Atari, Nintendo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : cat.collage7 ? (
                  <div className="w-full h-56 md:h-80 grid grid-cols-2 gap-0.5">
                    <img src="/img/96588d74a_generated_image.webp" alt="Griswold Cast Iron" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                    <img src="/img/2ac325373_generated_image.webp" alt="Home & Décor" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : cat.collage9 ? (
                  <div className="w-full h-56 md:h-80 grid grid-cols-2 gap-0.5">
                    <img src="/img/2f04db7ab_generated_image.webp" alt="Uranium glass collection" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src="/img/0bf12dc53_generated_image.webp" alt="Uranium glass UV glow" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : cat.collage8 ? (
                  <div className="w-full h-56 md:h-80 grid grid-cols-2 gap-0.5">
                    <img src="/img/ac93609f7_generated_image.webp" alt="Vintage smoking pipes" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src="/img/63ce2e7e9_generated_image.webp" alt="Vintage fountain pens" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : cat.collage6 ? (
                  <div className="w-full h-56 md:h-80 grid grid-cols-2 grid-rows-2 gap-0.5">
                    <img src="/img/b72c0acb4_generated_image.webp" alt="Old Baseball Cards" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src="/img/2a1d05cb6_generated_image.webp" alt="Boba Fett and Yoda Star Wars figures" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src="/img/4ad65e46c_generated_image.webp" alt="Early Boy Scout memorabilia" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src="/img/983a23228_generated_image.webp" alt="Pee-wee Herman style bicycle" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <img src={cat.image} alt={cat.title} className="w-full h-56 md:h-80 object-cover hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className={`w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center ${i % 2 === 0 ? "md:border-l" : "md:border-r"} border-foreground bg-background`}>
                <span className="inline-block bg-accent text-white font-heading font-black text-xs uppercase tracking-widest px-3 py-1 mb-4 w-fit">
                  Category {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-heading font-black text-foreground text-2xl md:text-4xl uppercase tracking-tight mb-6">
                  {cat.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <span key={item} className="font-heading text-xs uppercase tracking-wider border-2 border-foreground px-3 py-1.5 text-foreground font-bold hover:bg-foreground hover:text-background transition-colors">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* More items */}
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <h3 className="font-heading font-black text-background text-3xl md:text-5xl uppercase tracking-tight mb-8 text-center">
            And So Much More…
          </h3>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-12">
            {additionalItems.map((item) => (
              <span key={item} className="font-heading text-sm uppercase tracking-wider border-2 border-background/40 px-4 py-2 text-background font-bold hover:border-accent hover:text-accent transition-colors">
                {item}
              </span>
            ))}
          </div>
          <div className="text-center">
            <p className="text-background/60 mb-6 font-heading uppercase tracking-wide">Don't see your item? Call us — we buy almost everything.</p>
            <a href="tel:4129697757" className="inline-flex items-center gap-3 bg-accent text-white px-10 py-5 font-heading font-black text-2xl uppercase hover:bg-accent/90 transition-colors">
              <Phone className="w-6 h-6" />
              412-969-7757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}