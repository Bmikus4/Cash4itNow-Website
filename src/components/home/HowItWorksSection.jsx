import React from "react";
import { motion } from "framer-motion";
import { Home, DollarSign, Package, Truck } from "lucide-react";

const steps = [
  { icon: Home, title: "Full Estate Cleanouts", description: "We handle everything — from single rooms to entire estates. Professional and thorough." },
  { icon: DollarSign, title: "Cash On The Spot", description: "Fair market value, paid immediately. No waiting, no consignment fees." },
  { icon: Package, title: "Single Items Too", description: "Have just one piece? We buy individual items. Nothing is too small." },
  { icon: Truck, title: "We Come to You", description: "Serving Pittsburgh and all of Western Pennsylvania. We pick up." },
];

export default function HowItWorksSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16 text-center"
        >
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tight text-background mb-2">
            How It Works
          </h2>
          <div className="h-1.5 bg-accent w-24 mx-auto mt-3" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-background/20">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-foreground p-8 md:p-10"
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
    </section>
  );
}