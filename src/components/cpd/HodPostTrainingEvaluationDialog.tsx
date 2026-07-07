import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PostTrainingChecklist } from "@/components/cpd/PostTrainingChecklist";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchHodPostTrainingDetail,
  submitHodEvaluation,
  type HodEvaluationSubmission,
} from "@/lib/requisitionsApi";
import { formatHistoryDate, formatProgrammeDates } from "@/lib/requisitionStatus";

const defaultEvaluation: HodEvaluationSubmission = {
  knowledgeApplied: "yes",
  performanceImpact: "4",
  supportsDepartmentGoals: "yes",
  comments: "",
};

type HodPostTrainingEvaluationDialogProps = {
  requisitionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HodPostTrainingEvaluationDialog({
  requisitionId,
  open,
  onOpenChange,
}: HodPostTrainingEvaluationDialogProps) {
  const queryClient = useQueryClient();
  const [evaluation, setEvaluation] = React.useState<HodEvaluationSubmission>(defaultEvaluation);

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "hod", "post-training", requisitionId],
    queryFn: () => fetchHodPostTrainingDetail(requisitionId!),
    enabled: open && requisitionId != null,
  });

  React.useEffect(() => {
    if (!item?.hodEvaluationResponses) return;
    setEvaluation({
      knowledgeApplied: item.hodEvaluationResponses.knowledgeApplied,
      performanceImpact: item.hodEvaluationResponses.performanceImpact,
      supportsDepartmentGoals: item.hodEvaluationResponses.supportsDepartmentGoals,
      comments: item.hodEvaluationResponses.comments ?? "",
    });
  }, [item]);

  const submitMutation = useMutation({
    mutationFn: () => submitHodEvaluation(requisitionId!, evaluation),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["requisitions", "hod", "post-training"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "hod", "history"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "history"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to submit evaluation.");
    },
  });

  const canSubmit =
    item?.evaluationStatus === "due" &&
    !item.hodEvaluationFilled &&
    !submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load evaluation details."}
          </p>
        ) : item ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left">{item.title || "Untitled programme"}</DialogTitle>
              <DialogDescription className="text-left">
                {item.id} · {item.staffName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 text-sm">
              <div className="rounded-lg border bg-muted/10 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Staff:</span> {item.staffName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Category:</span> {item.category}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatProgrammeDates(item.programmeDates)}
                  </p>
                  {item.evaluationDueDate ? (
                    <p className="sm:col-span-2">
                      <span className="text-muted-foreground">Evaluation due:</span>{" "}
                      {formatHistoryDate(item.evaluationDueDate)} (3 months after programme)
                    </p>
                  ) : null}
                </div>
              </div>

              <PostTrainingChecklist
                requisitionId={item.requisitionId}
                postTraining={item.postTraining}
                showAction={false}
              />

              {item.staffSurveyResponses ? (
                <div className="rounded-lg border p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Staff e-survey summary
                  </p>
                  <div className="mt-2 grid gap-1 text-sm">
                    <p>Objectives met: {item.staffSurveyResponses.objectivesMet}</p>
                    <p>Satisfaction: {item.staffSurveyResponses.satisfaction}/5</p>
                    <p>Would recommend: {item.staffSurveyResponses.wouldRecommend}</p>
                  </div>
                </div>
              ) : null}

              {item.evaluationStatus === "upcoming" ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  HOD evaluation unlocks on {item.evaluationDueDate ? formatHistoryDate(item.evaluationDueDate) : "the due date"} —
                  3 months after the programme was attended.
                </div>
              ) : item.hodEvaluationFilled ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Evaluation already submitted for this requisition.
                </div>
              ) : (
                <div className="grid gap-4 rounded-lg border p-4">
                  <p className="text-sm font-medium">HOD evaluation survey</p>
                  <div className="grid gap-2">
                    <Label>Did the staff apply knowledge from the programme?</Label>
                    <Select
                      value={evaluation.knowledgeApplied}
                      onValueChange={(value) =>
                        setEvaluation((prev) => ({
                          ...prev,
                          knowledgeApplied: value as HodEvaluationSubmission["knowledgeApplied"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="partially">Partially</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Performance impact (1–5)</Label>
                    <Select
                      value={evaluation.performanceImpact}
                      onValueChange={(value) =>
                        setEvaluation((prev) => ({
                          ...prev,
                          performanceImpact: value as HodEvaluationSubmission["performanceImpact"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 — No impact</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5 — Significant impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Does this support department goals?</Label>
                    <Select
                      value={evaluation.supportsDepartmentGoals}
                      onValueChange={(value) =>
                        setEvaluation((prev) => ({
                          ...prev,
                          supportsDepartmentGoals: value as HodEvaluationSubmission["supportsDepartmentGoals"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hodEvalComments">Comments (optional)</Label>
                    <Textarea
                      id="hodEvalComments"
                      value={evaluation.comments ?? ""}
                      onChange={(e) => setEvaluation((prev) => ({ ...prev, comments: e.target.value }))}
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <DialogFooter>
              {canSubmit ? (
                <Button type="button" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit evaluation
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
