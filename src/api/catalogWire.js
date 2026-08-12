/**
 * THE ONE PLACE THE WIRE'S SPELLING IS DECIDED.
 *
 * The ruling (thera-40, ledger row 59, `fleet\briefs\c4in-website-catalog-wire-ruling.md`):
 *
 *   > ABSENT or `null` means NO ITEM CHANNEL — nothing has ever been published
 *   > for this sale. PRESENT means the channel EXISTS, and an empty `items`
 *   > array or a zero count then means PUBLISHED-AND-EMPTY, which is a
 *   > different fact.
 *
 * WHY IT IS A RULING AND NOT A PREFERENCE. A page that says "no photos from this
 * sale" when the truth is "the photographs have not been published yet" tells the
 * visitor the opposite of what is true, confidently. That is worse than saying
 * nothing: silence invites a phone call, and a wrong sentence ends the visit.
 *
 * THE THREE SPELLINGS ARE NOT EQUIVALENT AND MUST NEVER BE TREATED AS SUCH.
 * Omission and `null` both mean no channel. `{}` is PRESENT, so it means the
 * channel exists and this response carries no items — a different answer. A
 * consumer that shrugs and maps all three to "nothing to show" is how a contract
 * stops being a contract, and it is the specific move that produced F3d: the old
 * `if (!Array.isArray(catalog)) return []` collapsed absent, empty and
 * reference-only onto one apology.
 *
 * IF THE PLATFORM EVER CHANGES HOW IT SPELLS ANY OF THIS, THIS FILE IS THE ONE
 * LINE THAT CHANGES. That is the whole reason it exists as its own module rather
 * than as a condition inside the reader.
 *
 * No imports, so plain Node can exercise it — the `@` alias exists only in Vite.
 */

/** Nothing has ever been published for this sale. */
export const CHANNEL_ABSENT = "channel-absent";

/** A catalog exists. What it holds is a separate question. */
export const CHANNEL_PRESENT = "channel-present";

/**
 * The payload is a shape the contract does not define. NOT the same as absent:
 * absent is a fact the wire stated, this is the wire saying something we cannot
 * read, and conflating them would hide a contract break as a normal empty state.
 */
export const CHANNEL_UNRECOGNISED = "channel-unrecognised";

/**
 * Classifies the `catalog` field by PRESENCE ONLY. It deliberately does not look
 * at items or counts — that is the reader's job, and mixing the two questions is
 * what let a missing channel be reported as an empty one.
 */
export function channelPresence(catalog) {
  if (catalog === undefined || catalog === null) return CHANNEL_ABSENT;
  // An array or an object is a catalog the feed chose to send. `{}` included:
  // present is present, and the ruling says present means the channel exists.
  if (Array.isArray(catalog) || typeof catalog === "object") return CHANNEL_PRESENT;
  return CHANNEL_UNRECOGNISED;
}

/**
 * What to say when the wire breaks the contract. Points at the ruling rather
 * than describing the symptom, because the next person to see this will be
 * looking at a payload and needing to know which end is wrong.
 */
export function wireViolationMessage(catalog) {
  return (
    `catalog was ${typeof catalog} (${JSON.stringify(catalog)}), which the contract does not define. ` +
    "Per ledger row 59: absent or null means NO ITEM CHANNEL, present means the channel EXISTS. " +
    "See fleet/briefs/c4in-website-catalog-wire-ruling.md. The page will say nothing about photographs, " +
    "because silence is the only response to an unreadable payload that cannot be a lie."
  );
}
