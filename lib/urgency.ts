import type { Urgency } from "@/types";

/**
 * Shared visual config for the three urgency tiers, so the table, metric cards,
 * and Beacon panel all speak the same color language.
 */
export type UrgencyStyle = {
  /** Status-badge label. */
  label: string;
  /** Badge background + text classes. */
  badge: string;
  /** Solid bar / accent color class. */
  bar: string;
  /** Tinted surface background (cards, rows). */
  surface: string;
};

export const URGENCY_STYLES: Record<Urgency, UrgencyStyle> = {
  urgent: {
    label: "Order now",
    badge: "bg-red-100 text-red-700 border border-red-200",
    bar: "bg-red-500",
    surface: "bg-red-50 border-red-200",
  },
  watch: {
    label: "Watch",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    bar: "bg-amber-500",
    surface: "bg-amber-50 border-amber-200",
  },
  healthy: {
    label: "Healthy",
    badge: "bg-green-100 text-green-700 border border-green-200",
    bar: "bg-green-500",
    surface: "bg-green-50 border-green-200",
  },
};

/** Severity order for sorting: urgent (0) < watch (1) < healthy (2). */
export const URGENCY_RANK: Record<Urgency, number> = {
  urgent: 0,
  watch: 1,
  healthy: 2,
};
