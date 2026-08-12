import React from "react";
import { Phone } from "lucide-react";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { DEFAULT_DEGRADED_MESSAGE } from "@/api/salesWire";

/**
 * What a visitor sees when the sales feed could not answer.
 *
 * THE COPY, AND WHY IT IS THIS AND NOT SOMETHING ELSE.
 *
 * "No sales" is a lie when the truth is "we could not load them", and this is a
 * page a real customer reads before deciding whether to call — a business that
 * appears to have nothing on is a business they do not ring. So the section
 * cannot simply vanish the way it does when nothing is scheduled.
 *
 * A bare error is the other failure. "Error 503" or "Something went wrong" tells
 * a person nothing they can act on and reads as a broken company. So the notice
 * states the limit honestly ("we could not load"), never claims a fact we do not
 * have ("there are no sales"), and ends on the one route that still works: the
 * phone, which is how most of this business's customers reach it anyway.
 *
 * The number comes from `leadForm`'s constants and is never typed here — a
 * second copy of a phone number is a wrong phone number waiting for a redesign.
 *
 * The server's own sentence wins when it sends one, because it knows which
 * degradation this is; ours is the fallback so an absent message can never
 * produce an empty box. Rendered as TEXT, never as markup.
 */
export default function SalesUnavailableNotice({ message, tone = "dark" }) {
  const dark = tone === "dark";

  return (
    <div
      data-state="sales-unavailable"
      role="status"
      className={`border-2 p-6 md:p-8 max-w-2xl mx-auto text-center ${
        dark ? "border-background/20 bg-background/5" : "border-foreground/15 bg-foreground/5"
      }`}
    >
      <p
        className={`font-heading font-black text-lg md:text-xl uppercase tracking-tight mb-2 ${
          dark ? "text-background" : "text-foreground"
        }`}
      >
        We couldn't load the sales list
      </p>
      <p className={`text-sm leading-relaxed mb-5 ${dark ? "text-background/70" : "text-foreground/70"}`}>
        {message || DEFAULT_DEGRADED_MESSAGE}
      </p>
      <a
        href={CONTACT_PHONE_HREF}
        className="inline-flex items-center gap-2 font-heading font-black text-xs uppercase tracking-widest text-accent hover:underline"
      >
        <Phone className="w-3.5 h-3.5" />
        {CONTACT_PHONE}
      </a>
    </div>
  );
}
