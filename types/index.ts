/**
 * Shared domain types for Beacon by Peasy.
 *
 * The inventory model is intentionally small and founder-readable: everything
 * Beacon needs to decide whether a SKU is at risk lives on a single item.
 */

export type ItemCategory = "ingredient" | "packaging" | "other";

export type InventoryItem = {
  id: string;
  name: string;
  unit: string; // "lbs", "cases", "oz", "rolls"
  onHand: number;
  dailyVelocity: number; // average units consumed per day
  leadTimeDays: number; // days the supplier needs to fulfill an order
  supplier: string;
  unitCost: number; // cost per unit
  reorderQty: number; // recommended order quantity
  category: ItemCategory;
};

/** The three urgency tiers Beacon assigns, in descending severity. */
export type Urgency = "urgent" | "watch" | "healthy";

/** Payload the dashboard sends to the Beacon API for a single flagged item. */
export type BeaconRequestItem = {
  name: string;
  daysRemaining: number;
  leadTimeDays: number;
  reorderQty: number;
  unit: string;
  supplier: string;
};

export type BeaconRequest = {
  items: BeaconRequestItem[];
};

/** Beacon's response: a plain-English rationale per item, keyed by item name. */
export type BeaconResponse = {
  rationales: Record<string, string>;
};
