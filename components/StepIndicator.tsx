import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3;
};

const STEPS = [
  { id: 1, label: "Review inventory" },
  { id: 2, label: "Beacon analysis" },
  { id: 3, label: "Submit POs" },
] as const;

/** Three-step progress rail: Review → Beacon → Submit. */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    isComplete && "border-orange-500 bg-orange-500 text-white",
                    isActive &&
                      "border-orange-500 bg-orange-50 text-orange-600",
                    !isComplete &&
                      !isActive &&
                      "border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-orange-600"
                      : isComplete
                        ? "text-slate-700"
                        : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-4 h-px flex-1 transition-colors",
                    isComplete ? "bg-orange-500" : "bg-slate-200",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
