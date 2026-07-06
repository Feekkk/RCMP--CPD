import { Check, Circle, ClipboardList, FileCheck, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { TRAFFIC_LIGHT_STYLES } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";
import type { PostTrainingInfo } from "@/lib/requisitionsApi";

const STEPS = [
  { key: "attendanceAttached" as const, label: "Attendance", icon: FileCheck },
  { key: "eSurveyFilled" as const, label: "E-survey", icon: ClipboardList },
  { key: "hodEvaluationFilled" as const, label: "HOD evaluation", icon: Users },
];

type PostTrainingChecklistProps = {
  requisitionId?: number;
  postTraining: PostTrainingInfo;
  locked?: boolean;
  neutralStyle?: boolean;
  showAction?: boolean;
};

function stepStyles(done: boolean, locked: boolean, neutralStyle: boolean) {
  if (neutralStyle) {
    return done
      ? { circle: "bg-foreground text-background border-border", text: "text-foreground" }
      : { circle: "border-border bg-muted/40 text-muted-foreground", text: locked ? "text-muted-foreground" : "text-muted-foreground" };
  }
  if (done) {
    return {
      circle: cn(TRAFFIC_LIGHT_STYLES.green.dot, "text-white"),
      text: TRAFFIC_LIGHT_STYLES.green.text,
    };
  }
  if (locked) {
    return {
      circle: "border-muted-foreground/25 bg-muted/30 text-muted-foreground",
      text: "text-muted-foreground",
    };
  }
  return {
    circle: cn(TRAFFIC_LIGHT_STYLES.yellow.bg, TRAFFIC_LIGHT_STYLES.yellow.border),
    text: TRAFFIC_LIGHT_STYLES.yellow.text,
  };
}

export function PostTrainingChecklist({
  requisitionId,
  postTraining,
  locked = false,
  neutralStyle = false,
  showAction = true,
}: PostTrainingChecklistProps) {
  const allDone = postTraining.isComplete;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Post-training</p>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {postTraining.completedSteps}/{postTraining.totalSteps}
          </span>
          {showAction && requisitionId && !locked && !allDone ? (
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild>
              <Link to={`/staff/post-training/${requisitionId}`}>Open</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-1 sm:gap-0">
        {STEPS.map((step, idx) => {
          const done = postTraining[step.key];
          const styles = stepStyles(done, locked, neutralStyle);
          const Icon = step.icon;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                    styles.circle,
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : locked ? (
                    <Icon className="h-3 w-3 opacity-60" />
                  ) : (
                    <Circle className={cn("h-2 w-2 fill-current", styles.text)} />
                  )}
                </span>
                <span className={cn("text-xs font-medium", styles.text)}>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 hidden h-0.5 w-6 sm:block md:w-10",
                    done && !neutralStyle ? TRAFFIC_LIGHT_STYLES.green.dot : "bg-border",
                    done && neutralStyle && "bg-foreground/30",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {allDone && postTraining.cpdPointsCounted ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className={cn("h-3.5 w-3.5", !neutralStyle && TRAFFIC_LIGHT_STYLES.green.text)} />
          <span className={cn(!neutralStyle && TRAFFIC_LIGHT_STYLES.green.text, "font-medium")}>
            CPD points recorded{postTraining.cpdPoints != null ? ` · ${postTraining.cpdPoints} pts` : ""}
          </span>
        </p>
      ) : locked ? (
        <p className="text-xs text-muted-foreground">Unlocks after the programme date.</p>
      ) : postTraining.completedSteps < postTraining.totalSteps ? (
        <p className="text-xs text-muted-foreground">Complete all items to count CPD points.</p>
      ) : null}
    </div>
  );
}
