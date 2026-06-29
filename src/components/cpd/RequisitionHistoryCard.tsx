import * as React from "react";
import { CalendarDays, ChevronDown, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { PostTrainingChecklist } from "@/components/cpd/PostTrainingChecklist";
import { PreTrainingStepper } from "@/components/cpd/PreTrainingStepper";
import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { RequisitionHistoryItem } from "@/lib/requisitionsApi";
import {
  formatHistoryDate,
  formatProgrammeDates,
  isTrainingPast,
  preTrainingSteps,
  TRAFFIC_LIGHT_STYLES,
  workflowPhaseTrafficLight,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

type RequisitionHistoryCardProps = {
  item: RequisitionHistoryItem;
  showBudget?: boolean;
  editPath?: string;
};

export function RequisitionHistoryCard({
  item,
  showBudget = false,
  editPath = "/staff/requisition",
}: RequisitionHistoryCardProps) {
  const [open, setOpen] = React.useState(false);
  const isDraft = item.workflowPhase === "draft" || item.status === "save_draft";
  const trainingPast = isTrainingPast(item.programmeDates);
  const showPostTraining =
    item.workflowPhase === "post_training" ||
    item.workflowPhase === "completed" ||
    (item.statusGroup === "approved" && trainingPast);
  const postLocked = item.statusGroup === "approved" && !trainingPast && item.workflowPhase === "pre_training";
  const phaseStyles = TRAFFIC_LIGHT_STYLES[workflowPhaseTrafficLight(item.workflowPhase)];

  return (
    <Card className={cn("overflow-hidden border-l-4", phaseStyles.cardAccent)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
              aria-expanded={open}
            >
              <ChevronDown
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
              <div className="min-w-0 grid flex-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_auto_auto_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium leading-snug">{item.title || "Untitled programme"}</p>
                  <p className="text-xs text-muted-foreground">{item.id}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <RequisitionStatusBadge statusGroup={item.statusGroup} />
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  <p className="text-xs uppercase tracking-wide">Submitted</p>
                  <p className="font-medium text-foreground">{formatHistoryDate(item.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground sm:justify-end">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-wide">Programme date</p>
                    <p className="font-medium text-foreground">{formatProgrammeDates(item.programmeDates)}</p>
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          {isDraft ? (
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
              <Link to={`${editPath}?edit=${item.requisitionId}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>

        <CollapsibleContent>
          <div className="grid gap-4 border-t bg-muted/10 px-4 pb-4 pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="capitalize">Category: {item.category}</span>
              {item.venue ? <span>Venue: {item.venue}</span> : null}
              {showBudget ? <span className="font-medium text-foreground">RM {item.totalBudget.toFixed(2)}</span> : null}
              <span>Updated {formatHistoryDate(item.updatedAt)}</span>
            </div>

            <div className={cn("grid gap-2 rounded-lg border p-3", phaseStyles.border, "bg-background/80")}>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", TRAFFIC_LIGHT_STYLES.yellow.dot)} aria-hidden />
                Pre-training approval
              </p>
              <PreTrainingStepper steps={preTrainingSteps(item.status)} />
            </div>

            {showPostTraining || postLocked ? (
              <PostTrainingChecklist postTraining={item.postTraining} locked={postLocked} />
            ) : null}

            <div className="grid gap-1 text-sm text-muted-foreground">
              {item.departmentName ? <p>Department: {item.departmentName}</p> : null}
              <p>HRDC claimable: {item.hrdcClaimable ? "Yes" : "No"}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
