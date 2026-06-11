import { Boxes, AlertTriangle, Clock, DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  calcPOValue,
  getFlaggedItems,
  urgencyStatus,
} from "@/lib/reorder";
import type { InventoryItem } from "@/types";

type MetricCardsProps = {
  items: InventoryItem[];
};

/** Four headline stats. PO value counts flagged items only. */
export function MetricCards({ items }: MetricCardsProps) {
  const urgentCount = items.filter(
    (item) => urgencyStatus(item) === "urgent",
  ).length;
  const watchCount = items.filter(
    (item) => urgencyStatus(item) === "watch",
  ).length;
  const poValue = calcPOValue(getFlaggedItems(items));

  const cards = [
    {
      label: "SKUs tracked",
      value: String(items.length),
      icon: Boxes,
      iconClass: "text-slate-500 bg-slate-100",
      valueClass: "text-slate-900",
    },
    {
      label: "Urgent reorders",
      value: String(urgentCount),
      icon: AlertTriangle,
      iconClass: "text-red-600 bg-red-100",
      valueClass: "text-red-600",
    },
    {
      label: "On watch",
      value: String(watchCount),
      icon: Clock,
      iconClass: "text-amber-600 bg-amber-100",
      valueClass: "text-amber-600",
    },
    {
      label: "Estimated PO value",
      value: formatCurrency(poValue),
      icon: DollarSign,
      iconClass: "text-orange-600 bg-orange-100",
      valueClass: "text-slate-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  card.iconClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    card.valueClass,
                  )}
                >
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
