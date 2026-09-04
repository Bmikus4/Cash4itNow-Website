import React from "react";

/**
 * A sale's town and date, sized and shaped like one of the ribbon's photographs
 * so it can sit in the run of them.
 *
 * WHY IT EXISTS. The ribbon is about to be filled with real catalog photographs,
 * and a wall of objects says what the business sells without saying where or
 * when anyone can turn up. One card per row carries that instead of an item.
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
 * IT INVENTS NOTHING. It renders the town, the state and the date it was handed
 * and has no fallback text, because the alternative to a real sale here is no
 * card, not a card that says "coming soon". The caller does that filtering — see
 * HeroSection — so a feed that could not answer, and every prerendered snapshot,
 * simply has no cards of this kind in the ribbon.
 */
export default function HeroSaleCard({ city, state, date }) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-accent p-5 text-white">
      <span className="font-heading text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/75">
        Estate Sale
      </span>

      {/*
        break-words and a tight leading because the card is 180px wide and the
        towns are not all Gibsonia — "Mount Lebanon" has to wrap rather than
        overflow, and at leading-none a wrapped second line collides with the
        first.
      */}
      <span className="font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight break-words">
        {city}
      </span>

      <span>
        <span className="mb-2 block h-1 w-8 bg-white" />
        <span className="block font-heading text-lg font-black uppercase leading-none tracking-tight">
          {date}
        </span>
        {state && (
          <span className="mt-1 block font-heading text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/75">
            {state}
          </span>
        )}
      </span>
    </div>
  );
}
