import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, DollarSign, Package, Truck, ArrowRight } from "lucide-react";

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

        {/* CONTACT, NOT THE CALENDAR. This said "See Upcoming Sales" until Ben
            changed it, and the change is the better read of the spot: the four
            panels above it describe what the business does FOR YOU — cleanouts,
            cash, pickup — so the reader who has just finished them is a seller,
            and a seller sent to a list of sales to attend has been handed the
            wrong door. /upcoming-sales still has its own place in the nav and at
            the foot of the page for the buyer. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-accent text-accent px-8 py-4 font-heading font-bold text-lg uppercase tracking-wide hover:bg-accent hover:text-white transition-colors"
          >
            Contact Us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}