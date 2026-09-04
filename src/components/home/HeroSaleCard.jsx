import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * A scheduled sale, sized and shaped to ride in the hero's ribbon of
 * photographs, carrying where it is, when it opens, a way in and a way to keep
 * the address.
 *
 * WHY IT EXISTS. The ribbon is a wall of objects. It says what the business
 * sells and nothing about where or when anyone can turn up, which is the only
 * thing a visitor who is ready to act needs from this screen. One card per row
 * carries that instead of an item.
 *
 * IT IS TWO SLOTS WIDE, and that is a requirement rather than a flourish. The
 * photo cards are portrait and, once the ribbon is fitted to the hero, about
 * 113px across on a desktop — a width that holds "GIBSONIA" and nothing else.
 * A town, a date, a door time, a button and an icon need a landscape panel, so
 * this one takes the width of two photographs and the gap between them. The
 * ribbon's wrap arithmetic is built from a per-item offset table for exactly
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
 *
 * THE TYPE IS SIZED FROM THE RIBBON'S FIT, not from a breakpoint. The cards are
 * measured to the hero they are in, so the same card is 241px wide on a desktop
 * and 192 on a phone; a fixed 30px town name would overflow one of them whatever
 * value it took. Each size below is the size it wants at full scale, multiplied
 * by the fit, with a floor so nothing becomes decoration.
 *
 * IT INVENTS NOTHING. Every line is rendered only if the feed stated it, and the
 * caller drops a sale that has no town or no readable start — see HeroSection.
 * There is no placeholder text, because the alternative to a real sale here is
 * no card, not a card that says "coming soon". A snapshot therefore has none of
 * these at all.
 */

/**
 * WHAT "COPY THE ADDRESS" CAN HONESTLY COPY, AND WHY IT IS USUALLY A TOWN.
 *
 * Ben asked for a copy icon that puts the address on the clipboard. The public
 * feed does not carry a street address and must not: the contract withholds it
 * until 48 hours before the doors open, SaleCard states the same rule where the
 * Base44 export used to link the house to Google Maps, and
 * check-event-schema.mjs FAILS THE BUILD if an address reaches the structured
 * data. Publishing one here would put a stranger's house on the home page of a
 * site anyone can load.
 *
 * So this copies the most specific location the sale has actually given us: the
 * street line if the feed has started sending one for a sale that is imminent,
 * and the town and state otherwise. It copies what the card SHOWS, which is the
 * only version of this that cannot surprise anybody.
 */
function addressOf(sale) {
  return [sale?.address, sale?.location].filter(Boolean).join(", ");
}

export default function HeroSaleCard({ sale, scale = 1 }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  // Clearing on unmount matters more here than in most places: the ribbon
  // remounts its rows whenever the hero is resized, so a card that copied and
  // then had the window dragged would otherwise set state on a dead component.
  useEffect(() => () => clearTimeout(timer.current), []);

  const address = addressOf(sale);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // A clipboard write can be refused — an insecure origin, a permission
      // policy, an older browser. Saying nothing is right: the address is on
      // the card in front of them either way, and a red card that shouts about
      // a failed clipboard write is worse than one that quietly did not.
    }
  };

  const px = (want, floor) => `${Math.max(floor, Math.round(want * scale))}px`;
  const num = (want, floor) => Math.max(floor, Math.round(want * scale));
  const pad = num(18, 10);

  return (
    <div
      className="flex h-full w-full flex-col justify-between bg-accent text-white"
      style={{ padding: pad, gap: num(6, 4) }}
    >
      <div className="flex items-start justify-between" style={{ gap: num(8, 6) }}>
        <span
          className="font-heading font-bold uppercase leading-none text-white/75"
          style={{ fontSize: px(11, 9), letterSpacing: "0.28em" }}
        >
          Estate Sale
        </span>

        {/*
          THE COPY BUTTON, and it is a button rather than an icon with a click
          handler because it is the one control on this card that does not
          navigate: it has to be reachable by keyboard and it has to say what it
          did. aria-live on the label is what makes the tick audible to somebody
          who cannot see it change.
        */}
        {address && (
          <button
            type="button"
            onClick={copy}
            title={`Copy ${address}`}
            aria-label={copied ? `Copied ${address}` : `Copy ${address}`}
            className="shrink-0 rounded-sm text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {copied ? (
              <Check style={{ width: num(18, 13), height: num(18, 13) }} />
            ) : (
              <Copy style={{ width: num(18, 13), height: num(18, 13) }} />
            )}
          </button>
        )}
      </div>

      {/*
        break-words and a tight leading because the towns are not all Gibsonia —
        "Mount Lebanon" has to wrap rather than overflow, and at leading-none a
        wrapped second line collides with the first.
      */}
      <span
        className="font-heading font-black uppercase tracking-tight break-words"
        style={{ fontSize: px(31, 17), lineHeight: 0.95 }}
      >
        {sale.location}
      </span>

      <span className="block">
        <span className="mb-1 block bg-white" style={{ height: num(4, 2), width: num(30, 18) }} />
        {/*
          THE DATE AND THE DOOR TIME ON ONE LINE. SaleCard gives each its own
          row with an icon; there is no room for four rows here, and the two
          facts answer one question, so they are separated by a middot and the
          time is dropped rather than shortened when the feed did not state one
          (saleStartTime returns "" for a sale recorded as a date with no time,
          and printing "12:00 AM" would invent a door time nobody stated).
        */}
        <span
          className="block font-heading font-black uppercase leading-none tracking-tight"
          style={{ fontSize: px(17, 12) }}
        >
          {sale.when}
        </span>
      </span>

      <Link
        to="/upcoming-sales"
        className="group inline-flex items-center justify-center gap-1.5 border-2 border-white font-heading font-black uppercase leading-none tracking-widest transition-colors hover:bg-white hover:text-accent"
        style={{ fontSize: px(13, 10), padding: `${num(9, 6)}px ${num(10, 6)}px` }}
      >
        See More
        <ArrowRight
          className="transition-transform group-hover:translate-x-0.5"
          style={{ width: num(14, 11), height: num(14, 11) }}
        />
      </Link>
    </div>
  );
}
