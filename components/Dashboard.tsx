"use client";

import * as React from "react";
import { Radar, ArrowRight } from "lucide-react";

import { StepIndicator } from "@/components/StepIndicator";
import { MetricCards } from "@/components/MetricCards";
import { InventoryTable } from "@/components/InventoryTable";
import { BeaconPanel } from "@/components/BeaconPanel";
import { POBundle } from "@/components/POBundle";
import { getFlaggedItems, urgencyStatus } from "@/lib/reorder";
import type { InventoryItem } from "@/types";

type DashboardProps = {
  items: InventoryItem[];
};

type Step = 1 | 2 | 3;

/**
 * Client-side state machine driving the three-step flow:
 *   1. Review inventory  →  2. Beacon analysis  →  3. Submit POs
 */
export function Dashboard({ items }: DashboardProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [shouldScroll, setShouldScroll] = React.useState(false);
  const beaconRef = React.useRef<HTMLDivElement>(null);

  const flaggedItems = React.useMemo(() => getFlaggedItems(items), [items]);
  const urgentCount = items.filter(
    (item) => urgencyStatus(item) === "urgent",
  ).length;
  const watchCount = items.filter(
    (item) => urgencyStatus(item) === "watch",
  ).length;

  // Scroll to the Beacon panel when a flagged row sent us into step 2.
  React.useEffect(() => {
    if (currentStep === 2 && shouldScroll && beaconRef.current) {
      beaconRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScroll(false);
    }
  }, [currentStep, shouldScroll]);

  function handleFlaggedRowClick() {
    if (currentStep === 1) {
      setShouldScroll(true);
      setCurrentStep(2);
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} />

      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
        <Radar className="h-5 w-5 shrink-0 text-orange-500" />
        <p className="text-sm text-orange-900">
          <span className="font-semibold">
            Beacon spotted {flaggedItems.length} items that need attention
          </span>{" "}
          — {urgentCount} urgent, {watchCount} on watch.
        </p>
      </div>

      <MetricCards items={items} />

      {currentStep === 1 && (
        <>
          <InventoryTable
            items={items}
            onFlaggedRowClick={handleFlaggedRowClick}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Run Beacon analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <div ref={beaconRef} className="scroll-mt-6">
            <BeaconPanel items={flaggedItems} />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Build PO bundle
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {currentStep === 3 && <POBundle items={flaggedItems} />}
    </div>
  );
}
