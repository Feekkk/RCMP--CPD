import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Clock, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { PostTrainingChecklist } from "@/components/cpd/PostTrainingChecklist";
import { PreTrainingStepper } from "@/components/cpd/PreTrainingStepper";
import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { resubmitRequisition, type RequisitionHistoryItem } from "@/lib/requisitionsApi";
import {
  formatHistoryDate,
  formatProgrammeSlotDateLong,
  formatProgrammeSlotTimeDetail,
  isTrainingPast,
  nextUserAction,
  preTrainingSteps,
  TRAFFIC_LIGHT_STYLES,
  workflowPhaseTrafficLight,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

type RequisitionHistoryCardProps = {
  item: RequisitionHistoryItem;
  showBudget?: boolean;
  editPath?: string;
  neutralStyle?: boolean;
};

export function RequisitionHistoryCard({
  item,
  showBudget = false,
  editPath = "/staff/requisition",
  neutralStyle = false,
}: RequisitionHistoryCardProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const isDraft = item.workflowPhase === "draft" || item.status === "save_draft";
  const isHodRejected = item.status === "rejected_hod";
  const isHrRejected = item.status === "rejected_hr";
  const isApprovalRejected = item.status === "rejected";
  const isResubmittableRejected = isHodRejected || isHrRejected;
  const rejectionSource = isHodRejected ? "HOD" : isHrRejected ? "HR" : isApprovalRejected ? "Approval" : null;
  const trainingPast = isTrainingPast(item.programmeDates);
  const showPostTraining =
    item.workflowPhase === "post_training" ||
    item.workflowPhase === "completed" ||
    (item.statusGroup === "approved" && trainingPast);
  const postLocked = item.statusGroup === "approved" && !trainingPast && item.workflowPhase === "pre_training";
  const phaseStyles = neutralStyle
    ? TRAFFIC_LIGHT_STYLES.neutral
    : TRAFFIC_LIGHT_STYLES[workflowPhaseTrafficLight(item.workflowPhase)];
  const programmeSlots = item.programmeSlots?.length
    ? item.programmeSlots
    : item.programmeDates.map((date) => ({ date, from: "", to: "" }));
  const action = nextUserAction(item);

  const resubmitMutation = useMutation({
    mutationFn: () => resubmitRequisition(item.requisitionId),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["requisitions", "history"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "mine"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to resubmit requisition.");
    },
  });

  return (
    <Card className={cn("overflow-hidden", !neutralStyle && "border-l-4", !neutralStyle && phaseStyles.cardAccent)}>
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
              <div className="min-w-0 grid flex-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_auto_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium leading-snug">{item.title || "Untitled programme"}</p>
                  <p className="text-xs text-muted-foreground">{item.id}</p>
                  {rejectionSource && item.rejectionRemarks && !open ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {rejectionSource} remarks: {item.rejectionRemarks}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <RequisitionStatusBadge
                    statusGroup={item.statusGroup}
                    label={action.label}
                    light={action.light}
                  />
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  <p className="text-xs uppercase tracking-wide">Submitted</p>
                  <p className="font-medium text-foreground">{formatHistoryDate(item.submittedAt)}</p>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          {isDraft ? (
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
              <Link to={`${editPath}?edit=${item.requisitionId}`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          ) : null}
        </div>

        <CollapsibleContent>
          <div className="grid gap-3 border-t px-4 pb-4 pt-3">
            {rejectionSource && item.rejectionRemarks ? (
              <Alert className="border-border bg-muted/30">
                <AlertTitle>Rejection remarks from {rejectionSource}</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{item.rejectionRemarks}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="capitalize">Category: {item.category}</span>
              {item.venue ? <span>Venue: {item.venue}</span> : null}
              {showBudget ? <span className="font-medium text-foreground">RM {item.totalBudget.toFixed(2)}</span> : null}
              <span>Updated {formatHistoryDate(item.updatedAt)}</span>
            </div>

            <div className="rounded-md border bg-background/80 p-3">
              {programmeSlots.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                  <div className="divide-y rounded-md border text-xs">
                    {programmeSlots.map((slot, index) => (
                      <div
                        key={`${slot.date}-${slot.from}-${slot.to}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {programmeSlots.length > 1 ? (
                            <span className="shrink-0 font-medium text-muted-foreground">Day {index + 1}</span>
                          ) : null}
                          <span className="font-medium text-foreground">{formatProgrammeSlotDateLong(slot.date)}</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatProgrammeSlotTimeDetail(slot)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {programmeSlots.length ? <Separator className="my-3" /> : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pre-training approval
                </p>
                <PreTrainingStepper steps={preTrainingSteps(item.status)} neutralStyle={neutralStyle} />
              </div>

              {showPostTraining || postLocked ? (
                <>
                  <Separator className="my-3" />
                  <PostTrainingChecklist
                    requisitionId={item.requisitionId}
                    postTraining={item.postTraining}
                    locked={postLocked}
                    neutralStyle={neutralStyle}
                  />
                </>
              ) : null}
            </div>

            {isResubmittableRejected ? (
              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="gap-1.5" asChild>
                  <Link to={`${editPath}?edit=${item.requisitionId}`}>
                    <Pencil className="h-4 w-4" />
                    Edit requisition
                  </Link>
                </Button>
                <Button
                  type="button"
                  className="gap-1.5"
                  disabled={resubmitMutation.isPending}
                  onClick={() => resubmitMutation.mutate()}
                >
                  {resubmitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {isHrRejected ? "Resubmit for HR review" : "Resubmit to HOD"}
                </Button>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
