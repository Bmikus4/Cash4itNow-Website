import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * The sale card that rides in the hero's ribbon of photographs: where the next
 * sale is, when it opens, a way in, and a way to take the details with you.
 *
 * WHY IT EXISTS. The ribbon is a wall of objects. It says what the business
 * sells and nothing about where or when anyone can turn up, which is the only
 * thing a visitor who is ready to act needs from this screen. One card per row
 * carries that instead of an item.
 *
 * IT IS ALWAYS THERE. Ben: "if no events are listed they should still be there
 * and just say No Upcoming Events". A card that appears only when there happens
 * to be a sale is a card nobody learns to look for, and its absence says
 * nothing — a visitor cannot tell "no sales" from "this site has no such
 * feature". So the card is a fixture and only its sentence changes.
 *
 * THE THREE SENTENCES, and the difference between the last two is the whole
 * reason there are three:
 *
 *   sale    a real one, named, dated.
 *   none    the feed ANSWERED and there is nothing scheduled. A fact, sayable.
 *   pending we could not ask — a prerendered snapshot, or a degraded feed. NOT
 *           the same as "nothing scheduled", and it must never borrow that
 *           wording. Every snapshot is built without a feed, so baking "no
 *           upcoming events" into the static file would tell a crawler the
 *           calendar is empty on a day it is not. That is the defect 8cc500a
 *           fixed for the home page and check-degraded-states.mjs guards.
 *
 * IT IS TWO SLOTS WIDE, and that is a requirement rather than a flourish. The
 * photo cards are 180px portraits — a width that holds "GIBSONIA" and nothing
 * else. A town, a date, a door time, a button and an icon need a landscape
 * panel, so this takes the width of two photographs and the gap between them.
 * The ribbon's wrap arithmetic is built from a per-item offset table for exactly
 * this reason; see HeroCardRibbon.
 *
 * IT IS RED. The site's loudest device is a solid accent block — the phone CTA,
 * the VETERAN-OWNED chip, the numbered squares in Our Story — and this is the
 * one card in the row that is not a photograph, so it should not look like a
 * photograph that failed to load. Red among the objects reads as a flag planted
 * in them.
 *
 * ROUNDED like its neighbours, which is docs/UI-PRINCIPLES.md §8's radius-0 rule
 * broken in exactly the place it is already broken: inside this ribbon. A square
 * card among rounded ones would read as a mistake rather than as a distinction.
 */

/**
 * WHAT THE COPY BUTTON PUTS ON THE CLIPBOARD.
 *
 * It copied the address, until it turned out there is no address to copy: the
 * public feed withholds a sale's street until 48 hours before the doors open,
 * SaleCard says the same where the Base44 export used to link the house to
 * Google Maps, and check-event-schema.mjs FAILS THE BUILD if one reaches the
 * structured data. So the button was offering to copy a town, which nobody
 * needs a button for. Ben: "maybe the copy button should include some other
 * important info instead".
 *
 * It copies the whole sale now — what it is, where, when, and the page that
 * will still be right tomorrow. That is the block somebody pastes into a text
 * message to whoever they are dragging along on Saturday, which is the actual
 * job this button has.
 *
 * The link is read from window.location rather than written down, because
 * src/lib/origins.js is the only file allowed to spell this site's origin and a
 * build gate fails on a literal anywhere else.
 */
function detailsOf(sale) {
  if (!sale || sale.kind !== "sale") return "";
  const where = [sale.address, sale.location].filter(Boolean).join(", ");
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return [`Estate Sale — ${where}`, sale.when, origin ? `${origin}/upcoming-sales` : ""]
    .filter(Boolean)
    .join("\n");
}

/** The heading, and the only place the three states differ in what they claim. */
function headingOf(sale) {
  if (sale?.kind === "sale") return sale.location;
  if (sale?.kind === "none") return "No Upcoming Events";
  return "Upcoming Events";
}

export default function HeroSaleCard({ sale }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  // Clearing on unmount matters more here than in most places: the ribbon
  // rebuilds its rows whenever the hero is resized, so a card that copied and
  // then had the window dragged would otherwise set state on a dead component.
  useEffect(() => () => clearTimeout(timer.current), []);

  const details = detailsOf(sale);
  const heading = headingOf(sale);

  const copy = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // A clipboard write can be refused — an insecure origin, a permission
      // policy, an older browser. Saying nothing is right: the details are on
      // the card in front of them either way, and a red card that shouts about
      // a failed clipboard write is worse than one that quietly did not.
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-between bg-accent p-5 text-white">
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-[0.65rem] font-bold uppercase leading-none tracking-[0.28em] text-white/75">
          {sale?.kind === "sale" ? "Estate Sale" : "Estate Sales"}
        </span>

        {/*
          A BUTTON, not an icon with a click handler, because it is the one
          control here that does not navigate: it has to be reachable by
          keyboard and it has to say what it did. It is absent entirely when
          there is no sale, rather than present and dead — an empty calendar has
          nothing to copy.
        */}
        {details && (
          <button
            type="button"
            onClick={copy}
            title={copied ? "Copied" : "Copy the sale details"}
            aria-label={copied ? "Sale details copied" : "Copy the sale details"}
            className="shrink-0 rounded-sm text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {copied ? <Check className="h-[18px] w-[18px]" /> : <Copy className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>

      {/*
        break-words and a tight leading because the towns are not all Gibsonia —
        "Mount Lebanon, PA" has to wrap rather than overflow, and at leading-none
        a wrapped second line collides with the first.
      */}
      <span className="font-heading text-[1.7rem] font-black uppercase leading-[0.95] tracking-tight break-words">
        {heading}
      </span>

      <span className="block">
        <span className="mb-1.5 block h-1 w-8 bg-white" />
        {/*
          THE DATE AND THE DOOR TIME ON ONE LINE. SaleCard gives each its own row
          with an icon; there is no room for four rows here, and the two facts
          answer one question. The time is dropped rather than faked when the
          feed did not state one — saleStartTime returns "" for a sale recorded
          as a date with no time, and printing "12:00 AM" would invent a door
          time nobody stated.

          With no sale there is no second line at all: the rule stays as the
          card's spine so the three states are the same shape.
        */}
        {sale?.when && (
          <span className="block font-heading text-base font-black uppercase leading-none tracking-tight">
            {sale.when}
          </span>
        )}
      </span>

      <Link
        to="/upcoming-sales"
        className="group inline-flex items-center justify-center gap-1.5 border-2 border-white px-3 py-2.5 font-heading text-xs font-black uppercase leading-none tracking-widest transition-colors hover:bg-white hover:text-accent"
      >
        See More
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
