/**
 * Shop inventory.
 *
 * THERE IS NO SEPARATE INVENTORY ENDPOINT AND THERE DOES NOT NEED TO BE. The shop is a published
 * catalogue on the platform with the slug `shop`, so this asks `/api/public/catalog?slug=shop` —
 * the same transport, state machine, degraded handling and mock switch the sale page already uses.
 * A second endpoint would have been a second contract to keep in step with the first, for a
 * response that is the same shape.
 *
 * WHAT MAKES THAT CATALOGUE THE SHOP RATHER THAN A SALE is that no event points at it. The
 * platform's `publicSaleRefusal` requires an ESTATE_SALE event, so this catalogue can never appear
 * in the sales feed or on the calendar however it is published — it is reachable only by asking for
 * the slug. That is what standing inventory is: always there, not an event.
 *
 * WHY THIS RETURNS AN ARRAY AND NOT A FEED STATE, unlike `fetchCatalog`. The sale page has to tell
 * "catalogued but not published yet" apart from "no photographs", because the sales feed already
 * promised items exist and rendering empty would contradict it. The shop is asked cold — nothing
 * has promised anything — so "no items" and "we could not reach the feed" both correctly render the
 * same "Nothing listed right now". Collapsing them here is safe for that reason and only that one;
 * if the shop ever gains a count it can contradict, this has to grow the distinction back.
 */

import { fetchCatalog } from "@/api/catalogClient";

export const INVENTORY_QUERY_KEY = ["shop-items"];

/** The catalogue that is the shop. Changing this re-points the whole page. */
export const SHOP_SLUG = "shop";

/**
 * The platform has no sold/available column, and the feed is why it does not need one: it serves
 * PUBLISHED items only, so everything that arrives here is for sale. An item that sells gets
 * unpublished and stops being returned at all. Anything else would be this page inventing a fact
 * the platform never stated.
 */
const STATUS_OF_A_LISTED_ITEM = "available";

export async function fetchInventory() {
  const feed = await fetchCatalog(SHOP_SLUG);

  return (feed.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.askingPrice,
    category: item.category,
    condition: item.condition,
    status: STATUS_OF_A_LISTED_ITEM,
    // The card takes a list because an item may be photographed more than once. The public feed
    // carries only the primary image today, so the list has one entry — and a card written against
    // a list keeps working on the day the feed carries the rest.
    photo_urls: item.imageUrl ? [item.imageUrl] : [],
  }));
}
