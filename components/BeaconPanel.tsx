"use client";

import * as React from "react";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { daysRemaining, urgencyStatus } from "@/lib/reorder";
import { URGENCY_RANK } from "@/lib/urgency";
import type { BeaconRequestItem, BeaconResponse, InventoryItem } from "@/types";

type BeaconPanelProps = {
  /** Flagged items (urgent + watch). The panel sorts them urgent-first. */
  items: InventoryItem[];
};

const FALLBACK_RATIONALE = "Order now to avoid stockout.";

function toRequestItem(item: InventoryItem): BeaconRequestItem {
  return {
    name: item.name,
    daysRemaining: daysRemaining(item),
    leadTimeDays: item.leadTimeDays,
    reorderQty: item.reorderQty,
    unit: item.unit,
    supplier: item.supplier,
  };
}

export function BeaconPanel({ items }: BeaconPanelProps) {
  // Rationales arrive one item at a time, keyed by item name.
  // A name missing from the map means that card is still loading.
  const [rationales, setRationales] = React.useState<Record<string, string>>(
    {},
  );
  const hasFetched = React.useRef(false);

  // Urgent first, then watch. Stable across renders.
  const sortedItems = React.useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          URGENCY_RANK[urgencyStatus(a)] - URGENCY_RANK[urgencyStatus(b)],
      ),
    [items],
  );

  React.useEffect(() => {
    // Fire exactly once, the first time the panel mounts. The ref guard makes
    // this safe under React StrictMode's double-invoke in dev.
    if (hasFetched.current) return;
    hasFetched.current = true;

    // One request per item so cards populate progressively instead of the
    // whole panel blocking on the slowest generation. The /api/beacon route
    // accepts an array of any length, so each call sends a single item.
    for (const item of sortedItems) {
      fetch("/api/beacon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [toRequestItem(item)] }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Beacon request failed (${res.status})`);
          return res.json() as Promise<BeaconResponse>;
        })
        .then((data) => {
          const text = data.rationales?.[item.name] ?? FALLBACK_RATIONALE;
          setRationales((prev) => ({ ...prev, [item.name]: text }));
        })
        .catch((err) => {
          // A single failed call degrades to the fallback — never blocks the UI.
          console.error(`Beacon rationale failed for "${item.name}":`, err);
          setRationales((prev) => ({
            ...prev,
            [item.name]: FALLBACK_RATIONALE,
          }));
        });
    }
  }, [sortedItems]);

  const doneCount = sortedItems.filter(
    (item) => rationales[item.name] !== undefined,
  ).length;
  const allDone = doneCount === sortedItems.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-slate-900">
          Beacon rationale
        </h2>
        <span className="text-sm text-slate-500">
          {allDone
            ? `Why each of these ${sortedItems.length} items needs an order now`
            : `Generating rationales… ${doneCount}/${sortedItems.length}`}
        </span>
      </div>

      <div className="space-y-3">
        {sortedItems.map((item) => {
          const status = urgencyStatus(item);
          const isUrgent = status === "urgent";
          const Icon = isUrgent ? AlertTriangle : Clock;
          const rationale = rationales[item.name];
          const isLoading = rationale === undefined;
          const lineCost = item.reorderQty * item.unitCost;

          return (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isUrgent
                      ? "bg-orange-100 text-orange-600"
                      : "bg-amber-100 text-amber-600",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.supplier}</p>
                  {isLoading ? (
                    <div className="mt-2 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {rationale}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-900">
                    Order {item.reorderQty} {item.unit}
                  </p>
                  <p className="text-xs text-slate-500">
                    est. {formatCurrency(lineCost)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
