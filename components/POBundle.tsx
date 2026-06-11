"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { calcPOValue, groupBySupplier } from "@/lib/reorder";
import type { InventoryItem } from "@/types";

type POBundleProps = {
  /** Flagged items (urgent + watch) to draft purchase orders for. */
  items: InventoryItem[];
};

type SubmitState = "idle" | "submitting" | "submitted";

export function POBundle({ items }: POBundleProps) {
  const [state, setState] = React.useState<SubmitState>("idle");

  const supplierGroups = React.useMemo(() => groupBySupplier(items), [items]);
  const suppliers = Object.keys(supplierGroups);
  const grandTotal = calcPOValue(items);
  const poCount = suppliers.length;

  function handleSubmit() {
    if (state !== "idle") return;
    setState("submitting");

    // Simulated submission — log the bundle, then flip to success after 1.5s.
    console.log("[Beacon] Submitting purchase orders:", {
      poCount,
      grandTotal,
      orders: suppliers.map((supplier) => ({
        supplier,
        lineItems: supplierGroups[supplier].map((item) => ({
          item: item.name,
          qty: item.reorderQty,
          unit: item.unit,
          unitCost: item.unitCost,
          lineTotal: item.reorderQty * item.unitCost,
        })),
        subtotal: calcPOValue(supplierGroups[supplier]),
      })),
    });

    window.setTimeout(() => setState("submitted"), 1500);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">PO bundle</h2>
        <p className="text-sm text-slate-500">
          {items.length} items grouped into {poCount}{" "}
          {poCount === 1 ? "order" : "orders"} across {poCount}{" "}
          {poCount === 1 ? "supplier" : "suppliers"}.
        </p>
      </div>

      {state === "submitted" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              {poCount} POs submitted — syncing to QuickBooks
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {suppliers.map((supplier) => {
          const group = supplierGroups[supplier];
          const subtotal = calcPOValue(group);
          return (
            <Card key={supplier}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{supplier}</p>
                    <p className="text-xs text-slate-500">
                      {group.length} {group.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(subtotal)}
                  </p>
                </div>
                <Separator />
                <ul className="divide-y divide-slate-100">
                  {group.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                    >
                      <span className="flex-1 text-slate-700">{item.name}</span>
                      <span className="w-28 text-right tabular-nums text-slate-500">
                        {item.reorderQty} {item.unit}
                      </span>
                      <span className="w-20 text-right tabular-nums text-slate-500">
                        {formatCurrency(item.unitCost)}
                      </span>
                      <span className="w-24 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(item.reorderQty * item.unitCost)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-slate-600">
            Grand total
          </span>
          <span className="text-xl font-semibold tabular-nums text-slate-900">
            {formatCurrency(grandTotal)}
          </span>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={state !== "idle"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white transition-colors",
          "bg-orange-500 hover:bg-orange-600",
          "disabled:cursor-not-allowed disabled:opacity-70",
        )}
      >
        {state === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : state === "submitted" ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Submitted
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit all POs
          </>
        )}
      </button>
    </section>
  );
}
