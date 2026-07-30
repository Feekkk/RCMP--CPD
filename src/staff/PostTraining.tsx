import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileCheck, Loader2, Upload, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchPostTrainingDetail,
  postTrainingAttendanceUrl,
  removePostTrainingAttendance,
  submitPostTrainingAttendance,
  submitPostTrainingSurvey,
  type ESurveySubmission,
} from "@/lib/requisitionsApi";
import { cn } from "@/lib/utils";
import { StaffSidebar } from "@/staff/Sidebar";

const defaultSurvey: ESurveySubmission = {
  objectivesMet: "yes",
  satisfaction: "4",
  wouldRecommend: "yes",
  comments: "",
};

type StepKey = "attendance" | "survey" | "done";

function StepIndicator({ current }: { current: StepKey }) {
  const steps = [
    { key: "attendance" as const, label: "Evidence" },
    { key: "survey" as const, label: "E-survey" },
    { key: "done" as const, label: "Done" },
  ];
  const currentIndex = steps.findIndex((step) => step.key === current);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  complete && "bg-green-600 text-white dark:bg-green-500",
                  active && "bg-primary text-primary-foreground",
                  !complete && !active && "bg-muted text-muted-foreground",
                )}
              >
                {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className={cn("h-px flex-1", complete ? "bg-green-600 dark:bg-green-500" : "bg-border")} />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function PostTrainingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { requisitionId: requisitionIdParam } = useParams();
  const requisitionId = Number.parseInt(requisitionIdParam ?? "", 10);
  const validId = Number.isFinite(requisitionId) && requisitionId > 0 ? requisitionId : null;

  const [survey, setSurvey] = React.useState<ESurveySubmission>(defaultSurvey);
  const [attendanceFile, setAttendanceFile] = React.useState<File | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "post-training", validId],
    queryFn: () => fetchPostTrainingDetail(validId!),
    enabled: validId != null,
  });

  React.useEffect(() => {
    if (!data?.postTraining.eSurveyResponses) return;
    setSurvey({
      objectivesMet: data.postTraining.eSurveyResponses.objectivesMet,
      satisfaction: data.postTraining.eSurveyResponses.satisfaction,
      wouldRecommend: data.postTraining.eSurveyResponses.wouldRecommend,
      comments: data.postTraining.eSurveyResponses.comments ?? "",
    });
  }, [data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["requisitions", "post-training", validId] });
    queryClient.invalidateQueries({ queryKey: ["requisitions", "history"] });
    queryClient.invalidateQueries({ queryKey: ["requisitions", "mine"] });
  };

  const surveyMutation = useMutation({
    mutationFn: () => submitPostTrainingSurvey(validId!, survey),
    onSuccess: (result) => {
      toast.success(result.message);
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to submit e-survey.");
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: () => submitPostTrainingAttendance(validId!, attendanceFile!),
    onSuccess: (result) => {
      toast.success(result.message);
      setAttendanceFile(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to upload attendance.");
    },
  });

  const removeAttendanceMutation = useMutation({
    mutationFn: () => removePostTrainingAttendance(validId!),
    onSuccess: (result) => {
      toast.success(result.message);
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to remove attendance.");
    },
  });

  const locked = data?.locked ?? false;
  const surveyDone = data?.postTraining.eSurveyFilled ?? false;
  const attendanceDone = data?.postTraining.attendanceAttached ?? false;
  const currentStep: StepKey = surveyDone ? "done" : attendanceDone ? "survey" : "attendance";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Post-Training</h1>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/staff/requisition/track">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          {!validId ? (
            <Alert variant="destructive">
              <AlertTitle>Invalid requisition</AlertTitle>
              <AlertDescription>Open post-training from a requisition in your track list.</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load post-training</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
            </Alert>
          ) : data ? (
            <Card>
              <CardHeader className="space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-snug sm:text-xl">{data.title || "Untitled programme"}</CardTitle>
                  <CardDescription>
                    {data.id}
                    {data.category ? ` · ${data.category}` : ""}
                  </CardDescription>
                </div>
                {!locked ? (
                  <div className="w-full sm:max-w-md sm:shrink-0">
                    <StepIndicator current={currentStep} />
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="grid gap-6">
                {locked ? (
                  <Alert>
                    <AlertTitle>Not available yet</AlertTitle>
                    <AlertDescription>Post-training unlocks on or after your programme date.</AlertDescription>
                  </Alert>
                ) : currentStep === "attendance" ? (
                  <div className="mx-auto grid w-full max-w-3xl gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload attendance evidence</p>
                      <p className="text-sm text-muted-foreground">
                        Screenshot of your UniKL MAC or certificate of attendance.
                      </p>
                    </div>
                    <label
                      htmlFor="attendanceFile"
                      className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center transition-colors hover:bg-muted/40 sm:min-h-56 sm:py-14"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {attendanceFile ? attendanceFile.name : "Choose a file to upload"}
                      </span>
                      <span className="text-xs text-muted-foreground">PDF or image, up to 10 MB</span>
                      <Input
                        id="attendanceFile"
                        type="file"
                        accept=".pdf,image/*"
                        className="sr-only"
                        onChange={(e) => setAttendanceFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <Button
                      type="button"
                      disabled={!attendanceFile || attendanceMutation.isPending}
                      onClick={() => attendanceMutation.mutate()}
                      className="w-full sm:ml-auto sm:w-auto sm:min-w-40"
                    >
                      {attendanceMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Continue
                        </>
                      )}
                    </Button>
                  </div>
                ) : currentStep === "survey" ? (
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2 rounded-md border bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                      <FileCheck className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        Evidence uploaded
                        {data.postTraining.attendanceFileName ? ` · ${data.postTraining.attendanceFileName}` : ""}
                      </span>
                      <div className="ml-auto flex shrink-0 items-center gap-1">
                        {data.postTraining.attendanceFileName ? (
                          <Button variant="link" className="h-auto px-1 text-xs" asChild>
                            <a href={postTrainingAttendanceUrl(data.requisitionId)} target="_blank" rel="noreferrer">
                              View
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remove attendance evidence"
                          disabled={removeAttendanceMutation.isPending}
                          onClick={() => removeAttendanceMutation.mutate()}
                        >
                          {removeAttendanceMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <form
                      className="grid gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        surveyMutation.mutate();
                      }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">E-survey</p>
                        <p className="text-sm text-muted-foreground">Share your feedback about the programme.</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="objectivesMet">Did the programme meet its objectives?</Label>
                          <Select
                            value={survey.objectivesMet}
                            onValueChange={(value) =>
                              setSurvey((prev) => ({ ...prev, objectivesMet: value as ESurveySubmission["objectivesMet"] }))
                            }
                          >
                            <SelectTrigger id="objectivesMet">
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
                          <Label htmlFor="satisfaction">Overall satisfaction</Label>
                          <Select
                            value={survey.satisfaction}
                            onValueChange={(value) =>
                              setSurvey((prev) => ({ ...prev, satisfaction: value as ESurveySubmission["satisfaction"] }))
                            }
                          >
                            <SelectTrigger id="satisfaction">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 — Excellent</SelectItem>
                              <SelectItem value="4">4 — Good</SelectItem>
                              <SelectItem value="3">3 — Average</SelectItem>
                              <SelectItem value="2">2 — Below average</SelectItem>
                              <SelectItem value="1">1 — Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                          <Label htmlFor="wouldRecommend">Would you recommend this programme?</Label>
                          <Select
                            value={survey.wouldRecommend}
                            onValueChange={(value) =>
                              setSurvey((prev) => ({ ...prev, wouldRecommend: value as ESurveySubmission["wouldRecommend"] }))
                            }
                          >
                            <SelectTrigger id="wouldRecommend">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="comments">Additional comments (optional)</Label>
                        <Textarea
                          id="comments"
                          value={survey.comments ?? ""}
                          onChange={(e) => setSurvey((prev) => ({ ...prev, comments: e.target.value }))}
                          className="min-h-24 sm:min-h-32"
                          placeholder="Share any other feedback…"
                        />
                      </div>

                      <Button type="submit" disabled={surveyMutation.isPending} className="w-full sm:ml-auto sm:w-auto sm:min-w-40">
                        {surveyMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          "Submit e-survey"
                        )}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-10 text-center sm:py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Post-training complete</p>
                      <p className="text-sm text-muted-foreground">
                        Your evidence and e-survey have been submitted. HOD evaluation is pending.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/staff/requisition/track")}>
                      Return to track
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
