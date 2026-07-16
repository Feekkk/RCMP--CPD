import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { FUNDING_CLAIM_OPTIONS } from "@/components/cpd/FundingClaimFields";
import { HodPostTrainingEvaluationDialog } from "@/components/cpd/HodPostTrainingEvaluationDialog";
import { PreTrainingStepper } from "@/components/cpd/PreTrainingStepper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HODSidebar } from "@/HOD/Sidebar";
import { fetchCurrentUser } from "@/lib/authApi";
import { AUTH_ME_QUERY_KEY } from "@/hooks/useAuth";
import type { HodPostTrainingQueueItem, HodProgrammeSlot, HodQueueStatus, HodReviewQueueItem } from "@/lib/requisitionsApi";
import {
  fetchHodPostTrainingQueue,
  fetchHodReviewDetail,
  fetchHodReviewQueue,
  submitHodReview,
} from "@/lib/requisitionsApi";
import {
  formatHistoryDate,
  formatProgrammeDates,
  preTrainingSteps,
  statusGroupFromDb,
  statusGroupTrafficLight,
  TRAFFIC_LIGHT_STYLES,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

function formatRm(amount: number) {
  return `RM ${amount.toFixed(2)}`;
}

function fundingClaimLabel(value: string) {
  return FUNDING_CLAIM_OPTIONS.find((option) => option.value === value)?.label ?? "Not specified";
}

function formatSlotSchedule(slot: HodProgrammeSlot) {
  const date = formatHistoryDate(slot.date);
  if (!slot.from && !slot.to) return date;
  if (slot.from && slot.to) return `${date} · ${slot.from} – ${slot.to}`;
  return `${date} · ${slot.from || slot.to}`;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="rounded-lg border bg-muted/10 p-3">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

type HodReviewStatusFilter = "all" | "submitted" | "pending";
type ReviewPageTab = "pre_training" | "post_training";
type HodPostTrainingFilter = "all" | "due" | "upcoming" | "completed";

const STATUS_FILTER_TABS: {
  value: HodReviewStatusFilter;
  label: string;
  summaryKey: "total" | "pending" | "recommended";
}[] = [
  { value: "all", label: "All", summaryKey: "total" },
  { value: "submitted", label: "Submitted", summaryKey: "pending" },
  { value: "pending", label: "In review", summaryKey: "recommended" },
];

function matchesStatusFilter(row: HodReviewQueueItem, filter: HodReviewStatusFilter) {
  if (filter === "all") return true;
  return statusGroupFromDb(row.status) === filter;
}

function matchesPostTrainingFilter(row: HodPostTrainingQueueItem, filter: HodPostTrainingFilter) {
  if (filter === "all") return true;
  return row.evaluationStatus === filter;
}

function PostTrainingStatusBadge({ status }: { status: HodPostTrainingQueueItem["evaluationStatus"] }) {
  if (status === "completed") {
    return (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-700">
        Completed
      </Badge>
    );
  }
  if (status === "due") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
      >
        Due now
      </Badge>
    );
  }
  return <Badge variant="secondary">Upcoming</Badge>;
}

function HodQueueBadge({ status }: { status: HodQueueStatus }) {
  if (status === "recommended") {
    return (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-700">
        Recommended
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
    >
      Review needed
    </Badge>
  );
}

type ReviewDialogProps = {
  requisitionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecommend: (item: HodReviewQueueItem) => void;
  onReject: (item: HodReviewQueueItem) => void;
  isSubmitting: boolean;
};

function ReviewDialog({
  requisitionId,
  open,
  onOpenChange,
  onRecommend,
  onReject,
  isSubmitting,
}: ReviewDialogProps) {
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "hod", "detail", requisitionId],
    queryFn: () => fetchHodReviewDetail(requisitionId!),
    enabled: open && requisitionId != null,
  });

  const canReview = item?.hodStatus === "pending" && item?.status === "submitted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load requisition details."}
          </p>
        ) : item ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
                <div className="min-w-0 grid gap-1">
                  <DialogTitle className="text-left">{item.title || "Untitled programme"}</DialogTitle>
                  <DialogDescription className="text-left">
                    {item.id} · {item.category}
                  </DialogDescription>
                </div>
                <HodQueueBadge status={item.hodStatus} />
              </div>
            </DialogHeader>

            <div className="grid gap-4 text-sm">
              <DetailSection title="Staff & submission">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Staff name" value={item.staffName} />
                  <DetailField label="Staff email" value={item.staffEmail} />
                  <DetailField label="Department" value={item.departmentName} />
                  <DetailField label="Submitted" value={formatHistoryDate(item.submittedAt)} />
                </div>
              </DetailSection>

              <DetailSection title="Programme details">
                <div className="grid gap-3">
                  <DetailField label="Programme title" value={item.title} />
                  <DetailField label="Category" value={item.category} />
                  <DetailField label="Venue" value={item.venue} />
                  <DetailField label="Programme dates" value={formatProgrammeDates(item.programmeDates)} />
                  {item.programmeSlots.length ? (
                    <div className="grid gap-2">
                      <p className="text-xs text-muted-foreground">Schedule</p>
                      <ul className="grid gap-1.5">
                        {item.programmeSlots.map((slot, index) => (
                          <li
                            key={`${slot.date}-${slot.from}-${slot.to}-${index}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {formatSlotSchedule(slot)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </DetailSection>

              {item.justification ? (
                <DetailSection title="Justification">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{item.justification}</p>
                </DetailSection>
              ) : null}

              <DetailSection title="Organiser">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="Organiser"
                    value={
                      item.organiser.name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.organiser.name}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Contact person"
                    value={
                      item.organiser.contactPerson ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.organiser.contactPerson}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Phone"
                    value={
                      item.organiser.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.organiser.phone}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Email"
                    value={
                      item.organiser.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.organiser.email}
                        </span>
                      ) : null
                    }
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Address"
                      value={
                        item.organiser.address ? (
                          <span className="inline-flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {item.organiser.address}
                          </span>
                        ) : null
                      }
                    />
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Budget & funding">
                <div className="grid gap-3">
                  <DetailField
                    label="Funding claim"
                    value={item.fundingClaim ? fundingClaimLabel(item.fundingClaim) : "Not specified"}
                  />
                  <DetailField label="HRDC claimable" value={item.hrdcClaimable ? "Yes" : "No"} />
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Mileage</TableCell>
                          <TableCell className="text-right">{formatRm(item.budget.mileage)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Accommodation</TableCell>
                          <TableCell className="text-right">{formatRm(item.budget.accommodation)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Travel fare</TableCell>
                          <TableCell className="text-right">{formatRm(item.budget.travelFare)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Programme fees & others</TableCell>
                          <TableCell className="text-right">{formatRm(item.budget.others)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{formatRm(item.budget.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Uploaded documents">
                {item.documents.length ? (
                  <ul className="grid gap-2">
                    {item.documents.map((doc) => {
                      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.name);
                      return (
                        <li
                          key={`${doc.index}-${doc.name}`}
                          className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">Supporting document</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {isImage ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-md border"
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.name}
                                  className="h-16 w-24 object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ) : null}
                            <Button type="button" variant="outline" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                )}
              </DetailSection>

              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval progress</p>
                <div className="mt-2">
                  <PreTrainingStepper steps={preTrainingSteps(item.status)} />
                </div>
              </div>
            </div>

            <Separator />

            <DialogFooter className="gap-2 sm:gap-0">
              {canReview ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={isSubmitting}
                    onClick={() => onReject(item)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button type="button" disabled={isSubmitting} onClick={() => onRecommend(item)}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    Recommend
                  </Button>
                </>
              ) : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function HODReviewQueuePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageTab = searchParams.get("tab") === "post_training" ? "post_training" : "pre_training";
  const [statusFilter, setStatusFilter] = React.useState<HodReviewStatusFilter>("all");
  const [postTrainingFilter, setPostTrainingFilter] = React.useState<HodPostTrainingFilter>("all");
  const [selectedRequisitionId, setSelectedRequisitionId] = React.useState<number | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = React.useState<number | null>(null);
  const [confirmRejectItem, setConfirmRejectItem] = React.useState<HodReviewQueueItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = React.useState("");

  const { data: currentUser } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "hod", "review-queue"],
    queryFn: fetchHodReviewQueue,
    enabled: pageTab === "pre_training",
  });

  const {
    data: postTrainingData,
    isLoading: isPostTrainingLoading,
    isError: isPostTrainingError,
    error: postTrainingError,
  } = useQuery({
    queryKey: ["requisitions", "hod", "post-training", "queue"],
    queryFn: fetchHodPostTrainingQueue,
  });

  const setPageTab = (tab: ReviewPageTab) => {
    if (tab === "post_training") {
      setSearchParams({ tab: "post_training" });
    } else {
      setSearchParams({});
    }
  };

  const reviewMutation = useMutation({
    mutationFn: ({
      requisitionId,
      decision,
      remarks,
    }: {
      requisitionId: number;
      decision: "recommend" | "reject";
      remarks?: string;
    }) => submitHodReview(requisitionId, decision, remarks),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["requisitions", "hod", "review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "hod", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "hod", "post-training"] });
      setSelectedRequisitionId(null);
      setConfirmRejectItem(null);
      setRejectRemarks("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to submit review.");
    },
  });

  const rows = data?.requisitions ?? [];
  const filteredRows = React.useMemo(
    () => rows.filter((row) => matchesStatusFilter(row, statusFilter)),
    [rows, statusFilter],
  );
  const summary = data?.summary ?? { total: 0, pending: 0, recommended: 0, rejectedByHod: 0 };

  const postTrainingRows = postTrainingData?.requisitions ?? [];
  const filteredPostTrainingRows = React.useMemo(
    () => postTrainingRows.filter((row) => matchesPostTrainingFilter(row, postTrainingFilter)),
    [postTrainingRows, postTrainingFilter],
  );
  const postTrainingSummary = postTrainingData?.summary ?? { total: 0, due: 0, upcoming: 0, completed: 0 };

  const summaryCards: {
    filter: HodReviewStatusFilter | null;
    label: string;
    value: number;
    hint: string;
    icon: typeof ClipboardList;
    trafficLight: keyof typeof TRAFFIC_LIGHT_STYLES;
  }[] = [
    {
      filter: "all",
      label: "Total",
      value: summary.total,
      hint: "In your queue",
      icon: ClipboardList,
      trafficLight: "neutral",
    },
    {
      filter: "submitted",
      label: "Submitted",
      value: summary.pending,
      hint: "Awaiting your review",
      icon: Clock,
      trafficLight: "yellow",
    },
    {
      filter: "pending",
      label: "In review",
      value: summary.recommended,
      hint: "Endorsed forward",
      icon: ThumbsUp,
      trafficLight: "green",
    },
    {
      filter: null,
      label: "Rejected",
      value: summary.rejectedByHod,
      hint: "Rejected by HOD",
      icon: ThumbsDown,
      trafficLight: "red",
    },
  ];

  const postTrainingSummaryCards: {
    filter: HodPostTrainingFilter | null;
    label: string;
    value: number;
    hint: string;
    icon: typeof ClipboardList;
    trafficLight: keyof typeof TRAFFIC_LIGHT_STYLES;
  }[] = [
    {
      filter: "all",
      label: "Total",
      value: postTrainingSummary.total,
      hint: "Staff programmes attended",
      icon: ClipboardCheck,
      trafficLight: "neutral",
    },
    {
      filter: "due",
      label: "Due now",
      value: postTrainingSummary.due,
      hint: "3-month evaluation due",
      icon: Clock,
      trafficLight: "yellow",
    },
    {
      filter: "upcoming",
      label: "Upcoming",
      value: postTrainingSummary.upcoming,
      hint: "Waiting for 3-month mark",
      icon: CalendarDays,
      trafficLight: "neutral",
    },
    {
      filter: "completed",
      label: "Completed",
      value: postTrainingSummary.completed,
      hint: "Evaluation submitted",
      icon: ThumbsUp,
      trafficLight: "green",
    },
  ];

  const activeSummaryCards = pageTab === "pre_training" ? summaryCards : postTrainingSummaryCards;
  const activeFilter = pageTab === "pre_training" ? statusFilter : postTrainingFilter;

  const handleRecommend = (item: HodReviewQueueItem) => {
    reviewMutation.mutate({ requisitionId: item.requisitionId, decision: "recommend" });
  };

  const handleRejectConfirm = () => {
    if (!confirmRejectItem) return;
    const remarks = rejectRemarks.trim();
    if (!remarks) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    reviewMutation.mutate({
      requisitionId: confirmRejectItem.requisitionId,
      decision: "reject",
      remarks,
    });
  };

  const closeRejectDialog = () => {
    setConfirmRejectItem(null);
    setRejectRemarks("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {currentUser?.departmentName ?? "Head of Department"}
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Review Queue</h1>
              </div>
            </div>
          </div>

          <Tabs
            value={pageTab}
            onValueChange={(value) => setPageTab(value as ReviewPageTab)}
            className="mt-6"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0 sm:w-auto">
              <TabsTrigger
                value="pre_training"
                className={cn(
                  "gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-none sm:text-sm",
                  "data-[state=active]:border-amber-500 data-[state=active]:bg-amber-500 data-[state=active]:text-white",
                  "data-[state=inactive]:border-border data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground",
                )}
              >
                <ClipboardList className="h-4 w-4" />
                Pre-training review
              </TabsTrigger>
              <TabsTrigger
                value="post_training"
                className={cn(
                  "gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-none sm:text-sm",
                  "data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  "data-[state=inactive]:border-border data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground",
                )}
              >
                <ClipboardCheck className="h-4 w-4" />
                Post-training evaluation
                {postTrainingSummary.due > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      pageTab === "post_training"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {postTrainingSummary.due}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeSummaryCards.map((c) => {
              const styles = TRAFFIC_LIGHT_STYLES[c.trafficLight];
              const isActive = c.filter !== null && activeFilter === c.filter;
              const card = (
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", styles.bg)}>
                      <c.icon className={cn("h-4 w-4", styles.text)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{c.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                  </CardContent>
                </Card>
              );

              if (c.filter === null) {
                return (
                  <div
                    key={c.label}
                    className={cn("rounded-xl border", styles.summaryIdle)}
                  >
                    {card}
                  </div>
                );
              }

              return (
                <button
                  key={c.filter ?? c.label}
                  type="button"
                  onClick={() => {
                    if (c.filter === null) return;
                    if (pageTab === "pre_training") {
                      setStatusFilter(c.filter as HodReviewStatusFilter);
                    } else {
                      setPostTrainingFilter(c.filter as HodPostTrainingFilter);
                    }
                  }}
                  className={cn(
                    "rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    c.filter === null ? styles.summaryIdle : isActive ? styles.summaryActive : styles.summaryIdle,
                  )}
                >
                  {card}
                </button>
              );
            })}
          </div>

          {pageTab === "pre_training" ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Department requisitions</CardTitle>
              <CardDescription>Review and recommend staff CPD requests from your department.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as HodReviewStatusFilter)}>
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40">
                  {STATUS_FILTER_TABS.map((tab) => {
                    const light =
                      tab.value === "all" ? "neutral" : statusGroupTrafficLight(tab.value);
                    const styles = TRAFFIC_LIGHT_STYLES[light];
                    const count =
                      tab.summaryKey === "total"
                        ? summary.total
                        : tab.summaryKey === "pending"
                          ? summary.pending
                          : summary.recommended;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={cn("gap-1.5 text-xs sm:text-sm", styles.tabActive)}
                      >
                        <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
                        {tab.label}
                        <span
                          className={cn(
                            "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            tab.value === "all" ? "bg-muted text-foreground" : cn(styles.bg, styles.text),
                          )}
                        >
                          {count}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unable to load review queue."}
                </p>
              ) : null}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[112px]">ID</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead className="hidden lg:table-cell">Category</TableHead>
                      <TableHead className="hidden md:table-cell">Staff</TableHead>
                      <TableHead className="hidden md:table-cell">Submitted</TableHead>
                      <TableHead className="text-right">HOD action</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : filteredRows.length ? (
                      filteredRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground lg:hidden">{row.category}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                Submitted: {formatHistoryDate(row.submittedAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{row.category}</TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatHistoryDate(row.submittedAt)}</TableCell>
                          <TableCell className="text-right">
                            <HodQueueBadge status={row.hodStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequisitionId(row.requisitionId)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !isLoading && !isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          {rows.length
                            ? "No requisitions match this status filter."
                            : "No requisitions in the queue."}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Post-training evaluations</CardTitle>
              <CardDescription>
                Complete the HOD survey 3 months after staff have attended an approved programme.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs
                value={postTrainingFilter}
                onValueChange={(value) => setPostTrainingFilter(value as HodPostTrainingFilter)}
              >
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40">
                  {(
                    [
                      { value: "all", label: "All", count: postTrainingSummary.total },
                      { value: "due", label: "Due now", count: postTrainingSummary.due },
                      { value: "upcoming", label: "Upcoming", count: postTrainingSummary.upcoming },
                      { value: "completed", label: "Completed", count: postTrainingSummary.completed },
                    ] as const
                  ).map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                      {tab.label}
                      <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {isPostTrainingError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {postTrainingError instanceof Error ? postTrainingError.message : "Unable to load evaluations."}
                </p>
              ) : null}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[112px]">ID</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead className="hidden md:table-cell">Staff</TableHead>
                      <TableHead className="hidden lg:table-cell">Last attended</TableHead>
                      <TableHead className="hidden lg:table-cell">Evaluation due</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPostTrainingLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : filteredPostTrainingRows.length ? (
                      filteredPostTrainingRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                              {row.evaluationDueDate ? (
                                <p className="text-sm text-muted-foreground lg:hidden">
                                  Due: {formatHistoryDate(row.evaluationDueDate)}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {row.lastProgrammeDate ? formatHistoryDate(row.lastProgrammeDate) : "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {row.evaluationDueDate ? formatHistoryDate(row.evaluationDueDate) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <PostTrainingStatusBadge status={row.evaluationStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEvaluationId(row.requisitionId)}
                            >
                              {row.evaluationStatus === "due" ? "Evaluate" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !isPostTrainingLoading && !isPostTrainingError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          {postTrainingRows.length
                            ? "No evaluations match this filter."
                            : "No staff programmes are ready for HOD evaluation yet."}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      <ReviewDialog
        requisitionId={selectedRequisitionId}
        open={selectedRequisitionId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequisitionId(null);
        }}
        onRecommend={handleRecommend}
        onReject={(item) => {
          setConfirmRejectItem(item);
        }}
        isSubmitting={reviewMutation.isPending}
      />

      <HodPostTrainingEvaluationDialog
        requisitionId={selectedEvaluationId}
        open={selectedEvaluationId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedEvaluationId(null);
        }}
      />

      <AlertDialog
        open={confirmRejectItem != null}
        onOpenChange={(open) => {
          if (!open) closeRejectDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject requisition?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRejectItem
                ? `This will reject ${confirmRejectItem.id} (${confirmRejectItem.title}). The staff member will see your remarks.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="rejectRemarks">Rejection remarks</Label>
            <Textarea
              id="rejectRemarks"
              placeholder="Explain why this requisition is being rejected…"
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={reviewMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">{rejectRemarks.length}/500 characters</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewMutation.isPending} onClick={closeRejectDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={reviewMutation.isPending || !rejectRemarks.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleRejectConfirm();
              }}
            >
              {reviewMutation.isPending ? "Rejecting…" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
