import React from "react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Repairs",
    image: "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/c40cb01d6_generated_image.png",
    description: "Make every listing shine with essential updates like a fresh coat of paint and touch-ups that make a big impact.",
  },
  {
    title: "Refreshes",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
    description: "Elevate your listings with cosmetic enhancements like floor refinishing and cabinet refacing.",
  },
  {
    title: "Deep Cleaning",
    image: "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/48bb4e613_generated_image.png",
    description: "We leave the property spotless — windows, walls, floors, and every corner cleaned thoroughly so the home is move-in ready.",
  },
  {
    title: "Exterior Updates",
    collage: [
      "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/0b5311e77_mrh-why-you-should-hire-bellevue-pressure-washing-services.webp",
      "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/221f22e1d_worker-painting-metal-balcony-railing-gray-renovation-work-painter-applying-paint-using-brush-355981218.jpg",
    ],
    description: "Make every first impression count and boost curb appeal with yard clean-up, power washing, exterior paint, and landscaping.",
  },
];

export default function PropertyServicesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16 text-center"
        >
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-foreground mb-2">
            Getting the Home Ready 4 Sale
          </h2>
          <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col border border-border"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {s.collage ? (
                  <div className="w-full h-full grid grid-cols-2 gap-0.5">
                    <img src={s.collage[0]} alt="Pressure washing driveway" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <img src={s.collage[1]} alt="Painting exterior railing" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <div className="p-6 flex flex-col gap-2 flex-1">
                <div className="h-0.5 bg-accent w-8 mb-1" />
                <h3 className="font-heading font-black text-foreground text-xl uppercase tracking-tight">
                  {s.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}