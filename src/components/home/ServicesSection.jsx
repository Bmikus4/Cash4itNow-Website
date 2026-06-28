import React from "react";
import { motion } from "framer-motion";
import { Home, DollarSign, Package, Truck } from "lucide-react";

// Original flyer from the user — shown as a featured image
const ORIGINAL_FLYER = "/img/14dc69cc4_Screenshot_20260524_215817_Facebook.webp";

const services = [
  { icon: Home, title: "Full Estate Cleanouts", description: "We handle everything — from single rooms to entire estates. Professional and thorough." },
  { icon: DollarSign, title: "Cash On The Spot", description: "Fair market value, paid immediately. No waiting, no consignment fees." },
  { icon: Package, title: "Single Items Too", description: "Have just one piece? We buy individual items. Nothing is too small." },
  { icon: Truck, title: "We Come to You", description: "Serving Pittsburgh and all of Western Pennsylvania. We pick up." },
];

export default function ServicesSection() {
  return (
    <section id="services" className="bg-foreground">
      {/* Featured original flyer image as a banner strip */}
      <div className="w-full overflow-hidden relative h-48 md:h-64">
        <img
          src={ORIGINAL_FLYER}
          alt="Cash 4 It Now items we buy"
          className="w-full h-full object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-transparent to-foreground/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-heading font-black text-background text-2xl md:text-4xl uppercase tracking-wider text-center px-4">
            Hundreds of Categories — We Buy It All
          </p>
        </div>
      </div>

      <div className="py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-background mb-2">
              How It Works
            </h2>
            <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-background/20">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-b sm:border-r border-background/20 p-8 md:p-10 hover:bg-background/5 transition-colors"
              >
                <div className="w-12 h-12 bg-accent flex items-center justify-center mb-6">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-black text-background text-xl uppercase tracking-tight mb-3">{s.title}</h3>
                <p className="text-background/60 text-sm leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}