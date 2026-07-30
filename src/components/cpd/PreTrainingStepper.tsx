import { Check, Circle, X } from "lucide-react";

import { type PreTrainingStep, TRAFFIC_LIGHT_STYLES } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

function stepTrafficLight(state: PreTrainingStep["state"]) {
  switch (state) {
    case "complete":
      return TRAFFIC_LIGHT_STYLES.green;
    case "current":
      return TRAFFIC_LIGHT_STYLES.yellow;
    case "rejected":
      return TRAFFIC_LIGHT_STYLES.red;
    default:
      return TRAFFIC_LIGHT_STYLES.neutral;
  }
}

export function PreTrainingStepper({
  steps,
  neutralStyle = false,
}: {
  steps: PreTrainingStep[];
  neutralStyle?: boolean;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-1 sm:gap-0">
      {steps.map((step, idx) => {
        const colors = stepTrafficLight(step.state);
        return (
          <li key={step.key} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  step.state === "complete" && cn(TRAFFIC_LIGHT_STYLES.green.dot, "border-emerald-500 text-white"),
                  step.state === "current" &&
                    (neutralStyle
                      ? "border-foreground bg-muted text-foreground"
                      : cn(colors.bg, colors.border)),
                  step.state === "rejected" && cn(TRAFFIC_LIGHT_STYLES.red.dot, "border-red-500 text-white"),
                  step.state === "upcoming" && "border-muted-foreground/25 bg-muted/30 text-muted-foreground",
                )}
              >
                {step.state === "complete" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : step.state === "rejected" ? (
                  <X className="h-3.5 w-3.5" />
                ) : step.state === "current" ? (
                  <Circle
                    className={cn(
                      "h-2 w-2 fill-current",
                      neutralStyle ? "text-foreground" : TRAFFIC_LIGHT_STYLES.yellow.text,
                    )}
                  />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  neutralStyle
                    ? step.state === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground"
                    : cn(
                        step.state === "complete" && TRAFFIC_LIGHT_STYLES.green.text,
                        step.state === "current" && TRAFFIC_LIGHT_STYLES.yellow.text,
                        step.state === "rejected" && TRAFFIC_LIGHT_STYLES.red.text,
                        step.state === "upcoming" && "text-muted-foreground",
                      ),
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-2 hidden h-0.5 w-6 sm:block md:w-10",
                  step.state === "complete"
                    ? TRAFFIC_LIGHT_STYLES.green.dot
                    : step.state === "rejected"
                      ? TRAFFIC_LIGHT_STYLES.red.dot
                      : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
