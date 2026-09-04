import React from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, offerCatalogGraph, breadcrumbGraph } from "@/lib/structuredData";
import { CATEGORIES, ADDITIONAL_ITEMS } from "@/content/categories";

const categories = CATEGORIES;
const additionalItems = ADDITIONAL_ITEMS;

export default function Categories() {
  usePageMeta({
    title: "What We Buy",
    description:
      "Records, toys, military items, jewelry, signs, cast iron, glass and more — the full list of what Cash 4 It Now buys across Pittsburgh and Western Pennsylvania.",
  });
  useJsonLd("offer-catalog", offerCatalogGraph(categories, additionalItems));
  useJsonLd(
    "breadcrumb",
    breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: "What We Buy", path: "/categories" },
    ])
  );

  return (
    <div className="pt-16 bg-background">
      {/*
        NO FLYER BANNER. This page opened with a 40-to-52px-tall crop of
        /img/14dc69cc4_…Facebook.webp at 40% opacity under a 60% scrim — the
        original What We Buy flyer, a phone screenshot of a Facebook post.
        Removed on Ben's word. The same defect it carried on the home page it
        carried here: every category name in it is PIXELS, so the one image at
        the top of the page about what the business buys said nothing to a
        crawler, a screen reader or an assistant, and the markup underneath had
        to say all of it anyway.

        THE FILE STAYS IN public/. ServicesSection.jsx still renders it on the
        home page, so deleting the asset to tidy up would break that.

        py-14 md:py-20 is the site's standard section padding
        (docs/UI-PRINCIPLES.md §4) and replaces the py-10 that was here. The
        banner used to supply the top mass; without it, py-10 alone left this
        header visibly shallower than every other page's.
      */}
      <section className="bg-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
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