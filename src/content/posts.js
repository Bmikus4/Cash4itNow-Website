/**
 * The answer pages. THIS IS THE ONLY POST LIST — the routes, the rewrites, the
 * sitemap and the prerender crawl all derive from this array, so a post is added
 * here and nowhere else. A second list is the defect this file exists to prevent.
 *
 * Pure data, no imports. `vite.config.js` and `scripts/` import it directly under
 * plain Node, so anything that needs the app's `@` alias or `import.meta.env`
 * cannot live here.
 *
 * WHAT MAY BE WRITTEN HERE, AND WHAT MAY NOT.
 *
 * Every sentence must be true without a fact nobody on this build has. Process,
 * sequence and what-happens-next are established by the site's own copy and by
 * the plan; prices, payout ranges, commission rates, durations and claims about
 * what sells in this region are NOT, and inventing one is a factual claim made to
 * clients and referrers on a live commercial site. The four pages that need those
 * facts are listed in the drop written for Ben and are deliberately absent —
 * absent, rather than present with hedged prose standing in for a number, because
 * to an executor pricing three liquidators hedged prose reads as evasion and is
 * worse than no page at all.
 *
 * `updated` is a written-down date, never `new Date()`. The crawl must emit
 * byte-identical HTML across two builds of one commit, and a generated date
 * breaks that silently — the snapshot still looks right.
 */

/**
 * GEO form, per §8.2: `answer` is the whole answer and it renders first, above
 * every section, because an assistant summarising the page reads the top of it.
 * A post that opens with preamble and reaches its answer in the third section
 * fails the only test that matters here.
 */
export const POSTS = [
  {
    slug: "estate-sale-vs-auction-vs-buyout",
    question: "Estate sale, auction, or buyout — which one for which situation?",
    title: "Estate Sale vs Auction vs Buyout",
    description:
      "Which of the three fits your situation: an on-site estate sale, an auction, or an outright cash buyout of the contents. What each does, and what it leaves you to deal with.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "Three different jobs, and the right one depends on what the estate holds and how much time you have. An on-site estate sale suits a house with a lot in it and a variety of it — the contents are priced and sold where they stand, which is the highest-yield route when there is enough to draw buyers through the door. An auction suits a small number of items good enough that competing bidders set a better price than a tag would. An outright buyout suits time: one cash figure for the contents, the house cleared, and no sale dates to work around — which is usually the answer when there is a closing date, an out-of-state executor, or a property that has to be listed.",
      "The question underneath is almost always the same one: are you optimising for the highest total return, or for the property being empty and ready by a date. Those pull in opposite directions, and choosing the wrong one is what costs money. Nothing here commits you — the walkthrough that decides it is free and carries no obligation to sell through us.",
    ],
    sections: [
      {
        heading: "The three side by side",
        table: {
          caption: "How each route sets a price, and what it leaves behind",
          columns: ["", "Estate sale", "Auction", "Buyout"],
          rows: [
            ["How the price is set", "Priced by us, item by item, before the doors open", "By competing bidders on the day", "One figure for the contents, agreed up front"],
            ["Best when", "The house is full and the contents are varied", "A few items are strong enough to draw bidders", "The date matters more than the last dollar"],
            ["Speed", "Slowest of the three — the sale has to be prepared and advertised", "Depends on the auction calendar", "Fastest — nothing waits on a sale date"],
            ["What you do", "Nothing. We price, staff and run it", "Nothing, once the items are handed over", "Nothing. Agree the figure and hand over the keys"],
            ["What is left afterwards", "The unsold remainder, which we then clear", "Whatever did not sell comes back", "An empty house"],
          ],
        },
        body: [
          "These are not mutually exclusive. A common shape is a sale for the contents and a buyout for whatever is left standing on the last day, so the house goes from full to empty in one engagement rather than two.",
        ],
      },
      {
        heading: "When an estate sale is the right call",
        body: [
          "When the house is genuinely full, and full of different things. Estate sale buyers come for the mix — furniture, tools, kitchenware, records, jewelry, the contents of the basement and the attic. A house with volume and variety is what makes a sale worth staging, and staging is what produces the higher total.",
          "It is also the route that needs the most access. The contents have to stay where they are until the sale, and the house has to be open for it.",
        ],
      },
      {
        heading: "When an auction is the right call",
        body: [
          "When the value is concentrated in a few pieces rather than spread across a houseful. A small number of strong items can beat a tagged price, because two people who both want the same thing set the price between them instead of accepting the one on the label.",
          "The trade is that an auction handles the good items and not the house. Everything that was not worth consigning is still in the property afterwards.",
        ],
      },
      {
        heading: "When a buyout is the right call",
        body: [
          "When the calendar is the constraint. Executors working from another state, properties with a closing date, families who cannot keep making trips to a house — a buyout collapses the whole thing into one figure and one clearance.",
          "You are trading some of the upside for certainty and for the house being empty. That is often the right trade, and it is worth saying plainly rather than treating the highest theoretical return as the only goal.",
        ],
      },
      {
        heading: "What we would ask on the call",
        list: [
          "Roughly how full is the house, and how varied are the contents?",
          "Is there a date anything has to happen by — a closing, a listing, a family member travelling?",
          "Has anything already been taken, sold, or promised to an heir?",
          "Is the property accessible, and is the utility supply on?",
        ],
        body: [
          "Those four answers usually decide it before anyone walks the property, and the walkthrough confirms it.",
        ],
      },
    ],
  },

  {
    slug: "what-happens-to-what-doesnt-sell",
    question: "What happens to what doesn't sell?",
    title: "What Happens to What Doesn't Sell",
    description:
      "The contents that do not sell at an estate sale are cleared, not left for the family to deal with. What the clearout covers and what the house looks like at the end of it.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "It goes, and it does not become your problem. The clearout is a step of the job rather than an extra you arrange afterwards — whatever is still standing when the sale closes is removed, and the house is left broom-clean. That is the state a property has to be in before it can be photographed and listed, which is why the clearout is the step most estate timelines actually stall on.",
      "This is the part people are most often surprised by, because the alternative they have been quoted elsewhere is a sale that ends with a half-empty house and a separate clearance to book. You do not sort it, box it, haul it, or hire anyone for it. There is nothing left for you to come back for.",
    ],
    sections: [
      {
        heading: "Why the remainder exists at all",
        body: [
          "Every estate sale ends with a remainder. That is normal and expected, not a sign the sale went badly — a houseful of contents always includes things that are worn, broken, dated, or simply too ordinary to sell at any price worth the shelf space.",
          "Prices usually come down as the sale runs, which clears more of it, and a buyout of the standing remainder is one way to close the gap. Whatever is left after that is a clearance job, and it is ours.",
        ],
      },
      {
        heading: "Do not throw things out to help",
        body: [
          "The most expensive thing a family can do before a liquidator sees the house is clean it out. Categories that look like junk are routinely the ones that sell: costume jewelry, advertising signs and oil cans, old fishing gear, cameras, seventies electronics, Christmas and Halloween decorations, cast iron, uranium glass, pipes and pens, boxes of records.",
          "The rule that saves the most money is the simplest one — leave it, and let it be looked at first. Nothing is lost by having it valued and quite a lot can be lost by a full skip.",
        ],
      },
      {
        heading: "What broom-clean means",
        body: [
          "Empty of contents and swept, ready for the next trade through the door or for photographs. It is not a deep clean and it is not repairs — those are separate work, and where the property is being sold we do them too as part of getting it listing-ready.",
        ],
      },
    ],
  },

  {
    slug: "executors-checklist-clearing-a-parents-home",
    question: "Executor's checklist for clearing a parent's home",
    title: "Executor's Checklist for Clearing a Parent's Home",
    description:
      "The order to do things in when you are the executor clearing a parent's house — what to secure first, what not to throw away, and where valuing the contents fits.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "Do it in this order: secure the house and gather the paperwork, then stop — throw nothing away. Confirm with the estate's attorney what your authority is and whether anything has to be valued or accounted for before it moves. Let the family take what they are taking, and write down who took what. Only then have the contents valued, choose between a sale, an auction and a buyout, clear the remainder, and get the property ready to list.",
      "Almost every expensive mistake at this stage comes from one of two things, and they pull against each other: throwing away something that had value, or paying to store and move things that had none. Doing it in this order avoids both, because the valuation happens after the family has taken what it wants and before anything reaches a skip.",
      "You do not need to know what anything is worth to start. The walkthrough is free and carries no obligation to sell through us.",
    ],
    sections: [
      {
        heading: "The order",
        list: [
          "Secure the property. Change or account for every key, check that the doors and windows lock, and keep the utilities on — a house being cleared in the dark with no water is far harder to work in.",
          "Find the paperwork before it is boxed. Deeds, vehicle titles, insurance policies, bank and brokerage statements, safe-deposit keys, service records. Paperwork is the one category that is genuinely irreplaceable, and it is usually in a drawer nobody thought to check.",
          "Throw nothing away yet. Not the garage, not the basement, not the boxes marked junk.",
          "Ask the estate's attorney what your authority is and what has to be valued or recorded before it moves. That answer comes from the estate's own lawyer and the county, not from a liquidator, and it changes what you are allowed to do next.",
          "Let the heirs take what they are taking — and write down who took what, at the time. This is the step families skip and the one that causes the arguments.",
          "Have the contents valued. A walkthrough tells you what is there, what is worth selling, and which of the three routes fits.",
          "Choose the route: an on-site sale, an auction, or an outright buyout of the contents.",
          "Clear the remainder, so the house is empty and broom-clean.",
          "Get the property listing-ready if it is being sold.",
        ],
      },
      {
        heading: "What to look for before anything is moved",
        body: [
          "Not because these are the valuable things, but because they are the ones that get lost between the house and the skip.",
        ],
        list: [
          "Paperwork of any kind, and anything with a serial number or a title",
          "Anything in a safe, a lockbox, a filing cabinet, or taped underneath a drawer",
          "Military uniforms, medals, discharge papers and service memorabilia",
          "Jewelry, including costume jewelry, and loose stones in unmarked boxes",
          "Photographs, letters and family papers — no value to a buyer and irreplaceable to the family",
        ],
      },
      {
        heading: "Where the legal questions stop being ours",
        body: [
          "Whether the estate needs a formal valuation, what the register of wills requires, what an executor may sell and when — those are the estate attorney's answers and the county's, and they vary by estate. We can tell you what the contents are worth and clear the house; we cannot tell you what your filings require, and would not guess at it.",
        ],
      },
    ],
  },

  {
    slug: "house-listing-ready-after-a-death",
    question: "How do you get a house listing-ready after a death in the family?",
    title: "Getting a House Listing-Ready After a Death in the Family",
    description:
      "Contents out first, then cosmetic work. The order to get an inherited property from full to photographed, and why doing it the other way round wastes the work.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "Contents first, property second — always in that order. Empty the house, then clean and repair it, then photograph and list it. Painting or deep-cleaning a house that still has forty years of contents in it means doing the work twice, because the furniture has to move for the painter and the carpets get walked over again by everyone clearing the rooms.",
      "So the sequence is: value the contents, sell them, clear whatever is left, and only then start on the property. From there it is repairs and touch-ups, cosmetic refreshes, a deep clean, and the exterior work that decides the photograph a buyer sees first — the yard, power washing and paint.",
      "This is one engagement rather than four vendors: the evaluation, the sale, the clearout and the property work are the same job in sequence, with one point of contact. For realtors and attorneys who are handing over a property rather than living with it, that is the whole point — you hand over keys and a date.",
    ],
    sections: [
      {
        heading: "The sequence, and why each step is where it is",
        list: [
          "Evaluate — walk the property and price what is in it. No charge, and no obligation to sell through us.",
          "Sell the contents — an on-site estate sale, or an outright cash purchase where a sale is not worth the days.",
          "Clear the rest — everything unsold goes, and the house is left broom-clean.",
          "Get it listing-ready — repairs and touch-ups, cosmetic refreshes, a deep clean, and exterior work: yard, power washing, paint.",
        ],
        body: [
          "The clearout is the step that sits between a house that cannot be listed and one that can, and it is where inherited properties most often stall — usually because the family is doing it themselves in weekends, from another town.",
        ],
      },
      {
        heading: "What the exterior is worth doing",
        body: [
          "The first photograph in a listing is almost always the front of the house, and it is the one that decides whether the rest get looked at. An overgrown yard, a green driveway and a tired front door are cheap to fix and expensive to leave — they are read as neglect, and neglect is read as problems that are not visible in the photographs.",
        ],
      },
      {
        heading: "If you are the realtor or the attorney",
        body: [
          "You are usually the one holding a property that cannot be listed until somebody empties it, and a family that is not in a position to do it. There is a page for that side of the work, including how to refer a property without your client being contacted directly.",
        ],
        links: [{ label: "For realtors, attorneys and executors", to: "/for-professionals" }],
      },
    ],
  },

  {
    slug: "what-happens-after-you-call",
    question: "What happens after you call?",
    title: "What Happens After You Call",
    description:
      "The sequence from the first phone call to an empty house: what we ask, what the walkthrough is for, what you decide and when, and what you are not committing to by calling.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "You are not committing to anything by calling. We ask a few questions on the phone, arrange a time to walk the property, and price what is there. That walkthrough is free and carries no obligation to sell through us — if the answer is that you do not need us, that is a fine answer to get.",
      "After the walkthrough you have a decision to make, and it is the only significant one: an on-site estate sale, an auction, or an outright cash purchase of the contents. From there the sequence is fixed — the contents are sold, whatever is left is cleared so the house is broom-clean, and if the property is being sold we get it listing-ready.",
      "The thing most people want to know first is where the commitment starts. It starts when you accept a figure or agree a sale date, and not before. The call and the walkthrough are how you find out what you are dealing with.",
    ],
    sections: [
      {
        heading: "The call",
        body: [
          "Short, and mostly us asking. We need to know roughly how full the house is, whether anything has to happen by a particular date, whether anything has already been taken or promised, and whether the property is accessible. Those four answers usually decide which route fits before anyone walks through the door.",
          "You do not need to know what anything is worth, and you do not need to have tidied. It is genuinely better if you have not — that is on the page about what doesn't sell, and it is the single most expensive mistake families make before a liquidator sees a house.",
        ],
        links: [{ label: "Estate sale, auction, or buyout — which fits", to: "/blog/estate-sale-vs-auction-vs-buyout" }],
      },
      {
        heading: "The walkthrough, and why it comes first",
        body: [
          "We walk the property and price what is there. No charge, and no obligation to sell through us. It comes first because every other decision depends on it: which route makes sense, whether there is enough to justify staging a sale, and what the property will need once it is empty.",
          "It is not a formal appraisal and does not pretend to be one — no signed document, no figure for a court file. If the estate needs that kind of valuation, it has to happen before anything is sold or moved, which is why it is worth asking your attorney early rather than after a sale is booked.",
        ],
        links: [{ label: "Do I need an appraisal before selling?", to: "/blog/do-i-need-an-appraisal-before-selling" }],
      },
      {
        heading: "What you decide, and when",
        table: {
          caption: "Who decides what, at each point in the sequence",
          columns: ["Point", "The decision", "Whose it is"],
          rows: [
            ["Before the walkthrough", "Whether anything must be formally valued first", "The estate's attorney, not us"],
            ["Before pricing", "What the family is keeping, and who took what", "Yours — and write it down at the time"],
            ["After the walkthrough", "Sale, auction, or buyout", "Yours, with what the walkthrough found"],
            ["At the end of the sale", "What happens to the remainder", "Already settled — it is cleared either way"],
            ["Once the house is empty", "Whether the property needs work before listing", "Yours, and only if you are selling it"],
          ],
        },
        body: [
          "Everything above the last two rows happens before you have committed to anything.",
        ],
      },
      {
        heading: "Who you deal with",
        body: [
          "One number to call and one crew scheduling the work. If you would rather we did not contact anyone else — an elderly parent, a family member who is not ready for it, a client of yours — say so on the first call and we will not.",
          "Where a realtor or an attorney refers a property, we call them and not their client unless they ask otherwise.",
        ],
        links: [{ label: "For realtors, attorneys and executors", to: "/for-professionals" }],
      },
    ],
  },

  {
    slug: "paperwork-and-photographs-found-in-a-clearout",
    question: "We found paperwork and photographs — what should we do with them?",
    title: "Paperwork and Photographs Found in a Clearout",
    description:
      "What to do with documents, letters and family photographs turned up while clearing an estate — what to set aside, what should never go in a skip, and when to decide.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "Set them aside, and decide before the sale is priced rather than during it. Paperwork is the one category in a house that is genuinely irreplaceable — deeds, titles, policies and statements cannot be re-bought at any price, and neither can a photograph. Everything else in the house has a replacement somewhere; these do not.",
      "So the rule is simple: nothing made of paper leaves the house with the contents until somebody has looked at it. Not the filing cabinet, not the shoebox in the wardrobe, not the envelopes in the kitchen drawer. Once a clearout is underway, paper is the easiest thing in the building to lose, because it looks like the least valuable thing in it.",
      "Two separate questions sit underneath this, and they have different answers. What the estate's administration needs is your attorney's call, not ours. What happens to the family material nobody has claimed is a family decision, and it is far easier to make before the house is empty than after.",
    ],
    sections: [
      {
        heading: "Set aside first, sort later",
        body: [
          "Pull it out and put it somewhere that is not going to be cleared. Sorting can happen at a kitchen table weeks later; it cannot happen once the contents have gone.",
          "The list of what to look for, and where it hides, is on the executor's checklist — it is the same list, and there is no point in reading it twice.",
        ],
        links: [{ label: "Executor's checklist for clearing a parent's home", to: "/blog/executors-checklist-clearing-a-parents-home" }],
      },
      {
        heading: "What the estate actually needs is not our call",
        body: [
          "Which documents have to be produced, what has to be kept and for how long, what the register of wills expects — those answers come from the estate's attorney and from the county, and they vary by estate. We are not going to guess at them, and a liquidator who tells you confidently what you may shred is guessing.",
          "What we can say is the practical half: ask that question before the house is cleared rather than after, because it is the only order that works.",
        ],
      },
      {
        heading: "Anything with identifying details should be destroyed, not binned",
        body: [
          "Bank statements, tax paperwork, medical letters, anything carrying a full name with an account number or a date of birth. A skip outside a house that is obviously being cleared after a death is not a private place, and a bag of paper in it is readable by anyone who wants to read it.",
          "Destroy that material rather than throwing it out. This is the one piece of advice here that is not about value at all — it is about the fact that an estate clearout is visible from the street.",
        ],
      },
      {
        heading: "Photographs, letters and anything nobody has claimed",
        body: [
          "Family photographs and letters have no resale value and are irreplaceable, which is an awkward combination: they are worth nothing to a buyer and everything to the one relative who would have wanted them. That relative is often not the one clearing the house.",
          "Ask around before the sale rather than after. If nobody wants them, that is a decision the family has made deliberately, which is a different thing from a box that went out with the furniture because nobody thought to ask.",
          "Photographs of the house and its contents are worth keeping for a different reason — an executor accounting for what was in a property is glad of them later.",
        ],
      },
    ],
  },

  {
    slug: "do-i-need-an-appraisal-before-selling",
    question: "Do I need an appraisal before selling?",
    title: "Do I Need an Appraisal Before Selling?",
    description:
      "A formal appraisal is needed when a third party requires a number on paper. To decide what to do with a houseful of contents, a valuation walkthrough is the thing you actually need.",
    published: "2026-08-11",
    updated: "2026-08-11",
    answer: [
      "Usually not, in order to sell. A formal appraisal is a written valuation produced for a third party who requires one — a probate or estate-tax filing, an insurer, a division between heirs that has to be demonstrably fair, or a charitable-donation deduction. If none of those apply to you, an appraisal is a document you are paying for and nobody is going to read.",
      "What you actually need before selling is different: you need to know what is in the house, what is worth selling, and which route fits. That is a valuation walkthrough, and ours is free and carries no obligation to sell through us. It is not an appraisal and does not pretend to be one — no signed document, no figure for a court file.",
      "The person who can tell you whether your estate requires the formal kind is the estate's attorney, because it depends on the filings, not on the contents. If they say you need one, get one first: a formal appraisal has to be done before anything is sold or moved.",
    ],
    sections: [
      {
        heading: "Which one you need",
        table: {
          caption: "A formal appraisal versus a valuation walkthrough",
          columns: ["Why you are asking", "What you need"],
          rows: [
            ["A probate or estate-tax filing requires a value", "A formal appraisal — ask the estate's attorney which kind"],
            ["Insuring items you are keeping", "A formal appraisal, for the insurer"],
            ["Heirs are dividing items and it has to be seen to be fair", "A formal appraisal, so the number is not one family member's opinion"],
            ["Claiming a deduction for a donation", "A formal appraisal, to the standard the deduction requires"],
            ["Deciding whether to hold a sale, an auction, or take a buyout", "A valuation walkthrough — free, no obligation"],
            ["Finding out whether anything in the house is worth keeping back", "A valuation walkthrough"],
          ],
        },
      },
      {
        heading: "Why the order matters if you do need one",
        body: [
          "An appraisal values what was there. Once contents have been sold, given to family or cleared, there is nothing left to appraise and no honest way to reconstruct it. If the estate needs a formal valuation, that comes first and everything else waits — which is exactly why the question is worth asking the attorney early rather than after the sale is booked.",
        ],
      },
      {
        heading: "What a walkthrough tells you",
        list: [
          "What is in the house that has real resale value, and what does not",
          "Which items are worth holding back from a general sale",
          "Whether there is enough to justify an on-site sale, or whether a buyout fits better",
          "What the property will need once it is empty, if it is being sold",
        ],
        body: [
          "It costs nothing and commits you to nothing. If the answer is that you do not need us, that is a fine answer to get.",
        ],
      },
    ],
  },
];

/** Newest first is wrong for reference pages; this order is editorial. */
export const postBySlug = (slug) => POSTS.find((post) => post.slug === slug);

/** The one place a post's URL is spelled out. */
export const postPath = (post) => `/blog/${post.slug}`;
