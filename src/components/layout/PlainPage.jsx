import React from "react";

/**
 * A text page: the dark title band every page opens with, then prose. Static on purpose, with no
 * entrance animation: these are pages people read to check a policy, and a carrier's reviewer
 * reads them the same way.
 */
export default function PlainPage({ kicker, title, intro = null, children }) {
  return (
    <div className="pt-16 bg-background">
      <section className="relative py-16 md:py-24 bg-foreground">
        <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
        <div className="relative max-w-4xl mx-auto px-6 md:px-10">
          <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">{kicker}</p>
          <h1 className="font-heading font-black text-background text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
            {title}
          </h1>
          <div className="h-1.5 bg-accent w-24 mt-5" />
          {intro && <p className="text-background/70 text-lg max-w-2xl mt-5">{intro}</p>}
        </div>
      </section>
      <section className="py-12 md:py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto space-y-8 text-foreground/85 leading-relaxed">{children}</div>
      </section>
    </div>
  );
}

export function PlainSection({ title, children }) {
  return (
    <div>
      <h2 className="font-heading font-black text-foreground text-xl md:text-2xl uppercase tracking-tight mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
