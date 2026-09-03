/**
 * Shop inventory.
 *
 * There is no public inventory endpoint yet — the frozen contracts cover leads
 * and sales only — so this returns nothing and the Shop and Saved Items
 * pages render their empty states. That is exactly what the Base44 stub did,
 * with one difference: this is the single seam where the real endpoint lands,
 * instead of a fake SDK spread across the app.
 *
 * When it exists, fetch it here and return the item list. Nothing else changes.
 */
export const INVENTORY_QUERY_KEY = ["shop-items"];

export async function fetchInventory() {
  return [];
}
