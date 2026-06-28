import React from "react";
import { motion } from "framer-motion";
import { Shield, Heart, Handshake, Phone, DollarSign } from "lucide-react";

const VETERAN_IMG = "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/69fb4adcd_generated_c67afaf6.png";
const ESTATE_IMG = "https://media.base44.com/images/public/6a13ad06c542c7c693a2018d/37a3cc3a9_generated_e3d6fb2b.png";

const values = [
  { icon: Shield, title: "Veteran Values", description: "Founded on integrity, discipline, and service. We treat every client like family." },
  { icon: DollarSign, title: "Honest Pricing", description: "We research every item and offer fair market value. No lowball offers, no games." },
  { icon: Heart, title: "Respectful Service", description: "Estate liquidation can be emotional. We handle your belongings with care." },
  { icon: Handshake, title: "Community First", description: "Proudly serving Pittsburgh and Western Pennsylvania. Your neighbors trust us." },
];

export default function About() {
  return (
    <div className="pt-16 bg-background">
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-foreground">
        <div className="absolute inset-0">
          <img src={VETERAN_IMG} alt="Veteran owned" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 mb-6">
              <span className="font-heading font-bold text-sm uppercase tracking-widest">🇺🇸 Veteran-Owned Business</span>
            </div>
            <h1 className="font-heading font-black text-background text-5xl md:text-7xl uppercase tracking-tight leading-[0.9] mb-4">
              Our Story
            </h1>
            <div className="h-1.5 bg-accent w-24 mb-6" />
            <p className="text-accent font-heading font-bold text-base md:text-lg uppercase tracking-wide leading-relaxed max-w-2xl mb-4">
              From Valley Forge, the Pacific, Korea and the Middle East — our family has been here since the country took its first breaths.
            </p>
            <p className="text-background/70 text-lg leading-relaxed max-w-2xl">
              Cash 4 It Now was built on the values learned through military service — honor, hard work, and treating people right.
              We've turned our passion for history and collectibles into a trusted estate liquidation business serving all of Western Pennsylvania.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="font-heading font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight">
              Built on Trust
            </h2>
            <div className="h-1.5 bg-accent w-24 mt-3" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-foreground">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-r border-foreground p-8 md:p-10 hover:bg-foreground/5 transition-colors"
              >
                <div className="w-12 h-12 bg-accent flex items-center justify-center mb-5">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-black text-foreground text-xl uppercase tracking-tight mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-foreground py-14 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            <div className="w-full md:w-1/2">
              <img src={ESTATE_IMG} alt="Estate sale" className="w-full h-64 md:h-[28rem] object-cover" />
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="font-heading font-black text-background text-4xl md:text-5xl uppercase tracking-tight mb-8">
                Simple.<br />Fast. Fair.
              </h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Call Us", desc: "Tell us what you have. We give you a quick assessment right on the phone." },
                  { step: "02", title: "We Visit", desc: "We come to your location — house, storage unit, garage, anywhere in Western PA." },
                  { step: "03", title: "Get Paid", desc: "We make a fair offer on the spot. Accept and you get cash immediately." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 items-start">
                    <span className="bg-accent text-white font-heading font-black text-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-heading font-black text-background text-lg uppercase">{item.title}</h4>
                      <p className="text-background/60 text-sm leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="tel:4129697757"
                className="inline-flex items-center gap-3 bg-accent text-white px-8 py-4 font-heading font-black text-xl uppercase mt-10 hover:bg-accent/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Today
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}