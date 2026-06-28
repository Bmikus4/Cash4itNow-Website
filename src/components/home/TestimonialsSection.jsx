import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Margaret T.",
    location: "Mt. Lebanon, PA",
    quote: "After my mother passed, I didn't know where to start. Cash 4 It Now came out the next day, treated everything with such care, and gave us a fair price on the spot. I can't thank them enough.",
    stars: 5,
  },
  {
    name: "Robert & Linda S.",
    location: "Bethel Park, PA",
    quote: "We had a garage full of my dad's military collection — medals, uniforms, the works. They knew exactly what everything was worth and paid us more than we expected. Real professionals.",
    stars: 5,
  },
  {
    name: "Dave K.",
    location: "Peters Township, PA",
    quote: "Called on a Monday, they were at my house by Wednesday. Bought my entire record collection and a bunch of vintage signs. Fast, honest, and great to deal with.",
    stars: 5,
  },
  {
    name: "Carol M.",
    location: "South Hills, PA",
    quote: "I was nervous about selling my late husband's coin and card collection. They were patient, explained everything, and made the whole process so easy. Veteran-owned and it shows.",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16 text-center"
        >
          <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">What Clients Say</p>
          <h2 className="font-heading font-black text-background text-4xl md:text-6xl uppercase tracking-tight mb-2">
            Trusted by Families<br className="hidden md:block" /> Across Western PA
          </h2>
          <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-background/20">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 md:p-10 border-b border-r border-background/20 hover:bg-background/5 transition-colors"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-background/80 text-base leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent flex items-center justify-center font-heading font-black text-white text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-heading font-black text-background text-sm uppercase tracking-wide">{t.name}</p>
                  <p className="text-background/50 text-xs">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}