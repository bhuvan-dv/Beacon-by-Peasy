import type { InventoryItem, Urgency } from "@/types";

/**
 * Pure reorder math. No LLM, no side effects.
 *
 * This is the heart of Beacon's correctness: TypeScript decides *whether* and
 * *when* to reorder. Claude only ever explains the result in plain English.
 */

/** Days of stock remaining at the current velocity, rounded to 1 decimal. */
export function daysRemaining(item: InventoryItem): number {
  if (item.dailyVelocity <= 0) return Infinity;
  return Math.round((item.onHand / item.dailyVelocity) * 10) / 10;
}

/**
 * Classify an item's urgency.
 *
 * urgent: days remaining will run out within 3 days of the next delivery
 *         landing (daysRemaining <= leadTimeDays + 3)
 * watch:  a comfortable-but-shrinking buffer (daysRemaining <= leadTimeDays + 10)
 * healthy: everything else
 */
export function urgencyStatus(item: InventoryItem): Urgency {
  const days = daysRemaining(item);
  if (days <= item.leadTimeDays + 3) return "urgent";
  if (days <= item.leadTimeDays + 10) return "watch";
  return "healthy";
}

/** Items that belong in the Beacon panel: urgent + watch only. */
export function getFlaggedItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => urgencyStatus(item) !== "healthy");
}

/** Group items by supplier name. */
export function groupBySupplier(
  items: InventoryItem[],
): Record<string, InventoryItem[]> {
  return items.reduce<Record<string, InventoryItem[]>>((groups, item) => {
    (groups[item.supplier] ??= []).push(item);
    return groups;
  }, {});
}

/** Total PO value for a list of items (reorderQty * unitCost). */
export function calcPOValue(items: InventoryItem[]): number {
  return items.reduce(
    (total, item) => total + item.reorderQty * item.unitCost,
    0,
  );
}
