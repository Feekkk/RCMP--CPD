import { Check, ClipboardList, FileCheck, Star, Users } from "lucide-react";

import { TRAFFIC_LIGHT_STYLES } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";
import type { PostTrainingInfo } from "@/lib/requisitionsApi";

const STEPS = [
  { key: "attendanceAttached" as const, label: "Attendance", icon: FileCheck },
  { key: "eSurveyFilled" as const, label: "E-survey", icon: ClipboardList },
  { key: "hodEvaluationFilled" as const, label: "HOD evaluation", icon: Users },
];

type PostTrainingChecklistProps = {
  postTraining: PostTrainingInfo;
  locked?: boolean;
  compact?: boolean;
};

export function PostTrainingChecklist({ postTraining, locked = false, compact = false }: PostTrainingChecklistProps) {
  const allDone = postTraining.isComplete;
  const progressLight =
    allDone && postTraining.cpdPointsCounted
      ? "green"
      : locked
        ? "neutral"
        : postTraining.completedSteps > 0
          ? "yellow"
          : "yellow";

  const headerStyles = TRAFFIC_LIGHT_STYLES[progressLight];

  return (
    <div className={cn("grid gap-2 rounded-lg border p-3", headerStyles.border, headerStyles.bg, compact ? "gap-1.5" : "gap-2")}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", headerStyles.text)}>
          <span className={cn("h-2 w-2 rounded-full", headerStyles.dot)} aria-hidden />
          Post-training
        </p>
        <span className={cn("text-xs font-semibold tabular-nums", headerStyles.text)}>
          {postTraining.completedSteps}/{postTraining.totalSteps}
        </span>
      </div>

      <div className={cn("grid gap-1.5 sm:grid-cols-3")}>
        {STEPS.map(({ key, label, icon: Icon }) => {
          const done = postTraining[key];
          const itemLight = done ? "green" : locked ? "neutral" : "yellow";
          const itemStyles = TRAFFIC_LIGHT_STYLES[itemLight];

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs",
                itemStyles.border,
                itemStyles.bg,
                locked && !done && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  done ? cn(itemStyles.dot, "text-white") : cn("border", itemStyles.border, itemStyles.bg),
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className={cn("h-3 w-3", itemStyles.text)} />
                )}
              </span>
              <span className={cn("font-medium", itemStyles.text)}>{label}</span>
            </div>
          );
        })}
      </div>

      {allDone && postTraining.cpdPointsCounted ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            TRAFFIC_LIGHT_STYLES.green.border,
            TRAFFIC_LIGHT_STYLES.green.bg,
          )}
        >
          <Star className={cn("h-4 w-4", TRAFFIC_LIGHT_STYLES.green.text)} />
          <span className={cn("font-medium", TRAFFIC_LIGHT_STYLES.green.text)}>
            CPD points recorded
            {postTraining.cpdPoints != null ? `: ${postTraining.cpdPoints}` : ""}
          </span>
        </div>
      ) : locked ? (
        <p className="text-xs text-muted-foreground">Available after the programme date.</p>
      ) : postTraining.completedSteps < postTraining.totalSteps ? (
        <p className={cn("text-xs font-medium", TRAFFIC_LIGHT_STYLES.yellow.text)}>
          Action needed — complete all checklist items to count CPD points.
        </p>
      ) : null}
    </div>
  );
}
