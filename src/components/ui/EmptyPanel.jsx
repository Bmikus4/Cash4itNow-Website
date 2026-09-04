import React from "react";

/**
 * "There is nothing here, and here is what to do about it" — one panel, wherever
 * a page has to say it.
 *
 * WHY IT EXISTS. /shop and /upcoming-sales were both saying it, in panels
 * written twice: one had a 3xl heading in a solid black box 3 columns wide with
 * an accent eyebrow and two buttons, the other a 2xl heading in a faint grey box
 * 2 columns wide with an icon and a text link. Ben, with both on screen: "the
 * cards for an empty upcoming sales screen, and an empty shop screen are not the
 * same style/size". They were never meant to differ; they differed because
 * nothing held them together. This is the same argument SaleCard settled for the
 * sale listing, and the same fix.
 *
 * IT IS NOT THE ERROR NOTICE. `SalesUnavailableNotice` stays its own, quieter
 * shape on purpose: "nothing is scheduled" is a fact the site is stating and
 * should say plainly, while "we could not load the list" is an apology and must
 * not be dressed up to look like one. Collapsing the two is the exact defect
 * `check-degraded-states.mjs` fails the build over. Do not route it through
 * here to tidy up.
 *
 * WHAT EACH PAGE STILL OWNS: its eyebrow, its heading, its sentence and its
 * buttons. The panel owns the box, the rhythm and the type scale — the things
 * that were drifting.
 */
export default function EmptyPanel({ icon: Icon, eyebrow, title, children, actions }) {
  return (
    <div className="border-2 border-foreground max-w-3xl mx-auto my-8 p-8 md:p-12 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-accent flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-white" />
        </div>
      )}

      {eyebrow && (
        <p className="font-heading text-accent text-sm uppercase tracking-[0.3em] mb-3">{eyebrow}</p>
      )}

      <h2 className="font-heading font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-4">
        {title}
      </h2>

      {children && <div className="text-muted-foreground max-w-lg mx-auto mb-8">{children}</div>}

      {actions && <div className="flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>}
    </div>
  );
}
