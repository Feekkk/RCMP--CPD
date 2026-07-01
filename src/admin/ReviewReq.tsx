import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
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
import { toast } from "sonner";

import { AdminSidebar } from "@/admin/Sidebar";
import { FUNDING_CLAIM_OPTIONS } from "@/components/cpd/FundingClaimFields";
import { PreTrainingStepper } from "@/components/cpd/PreTrainingStepper";
import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminVerifyQueueItem, HodProgrammeSlot } from "@/lib/requisitionsApi";
import {
  fetchAdminVerifyDetail,
  fetchAdminVerifyQueue,
  submitAdminVerify,
} from "@/lib/requisitionsApi";
import {
  formatHistoryDate,
  formatProgrammeDates,
  preTrainingSteps,
  statusGroupFromDb,
} from "@/lib/requisitionStatus";

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

type VerifyDialogProps = {
  requisitionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (item: AdminVerifyQueueItem) => void;
  onReject: (item: AdminVerifyQueueItem) => void;
  isSubmitting: boolean;
};

function VerifyDialog({
  requisitionId,
  open,
  onOpenChange,
  onVerify,
  onReject,
  isSubmitting,
}: VerifyDialogProps) {
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "verify-detail", requisitionId],
    queryFn: () => fetchAdminVerifyDetail(requisitionId!),
    enabled: open && requisitionId != null,
  });

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
                <Badge
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-700"
                >
                  HOD recommended
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-4 text-sm">
              {item.hodRecommendation ? (
                <DetailSection title="HOD recommendation">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Recommended by" value={item.hodRecommendation.name} />
                    <DetailField label="HOD email" value={item.hodRecommendation.email} />
                    <DetailField
                      label="Recommended on"
                      value={formatHistoryDate(item.hodRecommendation.recommendedAt)}
                    />
                    {item.hodRecommendation.remarks ? (
                      <div className="sm:col-span-2">
                        <DetailField label="Remarks" value={item.hodRecommendation.remarks} />
                      </div>
                    ) : null}
                  </div>
                </DetailSection>
              ) : null}

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
              <Button type="button" disabled={isSubmitting} onClick={() => onVerify(item)}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Verify
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AdminVerifyRequisitionPage() {
  const queryClient = useQueryClient();
  const [selectedRequisitionId, setSelectedRequisitionId] = React.useState<number | null>(null);
  const [confirmRejectItem, setConfirmRejectItem] = React.useState<AdminVerifyQueueItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = React.useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "verify-queue"],
    queryFn: fetchAdminVerifyQueue,
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      requisitionId,
      decision,
      remarks,
    }: {
      requisitionId: number;
      decision: "verify" | "reject";
      remarks?: string;
    }) => submitAdminVerify(requisitionId, decision, remarks),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["requisitions", "admin", "verify-queue"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "admin", "verify-detail"] });
      setSelectedRequisitionId(null);
      setConfirmRejectItem(null);
      setRejectRemarks("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to submit verification.");
    },
  });

  const rows = data?.requisitions ?? [];
  const total = data?.summary.total ?? 0;

  const handleVerify = (item: AdminVerifyQueueItem) => {
    verifyMutation.mutate({ requisitionId: item.requisitionId, decision: "verify" });
  };

  const handleRejectConfirm = () => {
    if (!confirmRejectItem) return;
    const remarks = rejectRemarks.trim();
    if (!remarks) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    verifyMutation.mutate({
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
      <AdminSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Verify Requisition</h1>
              </div>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Awaiting verification</CardTitle>
              <CardDescription>
                Requisitions recommended by HOD and pending admin verification before dean approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="tabular-nums">
                  {total}
                </Badge>
                <span>{total === 1 ? "requisition" : "requisitions"} in queue</span>
              </div>

              {isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unable to load verify queue."}
                </p>
              ) : null}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[112px]">ID</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead className="hidden lg:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell">Staff</TableHead>
                      <TableHead className="hidden md:table-cell">Recommend</TableHead>
                      <TableHead className="text-right">Status</TableHead>
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
                    ) : rows.length ? (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground lg:hidden">{row.departmentName}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                              {row.hodRecommendation ? (
                                <p className="text-sm text-muted-foreground md:hidden">
                                  HOD: {row.hodRecommendation.name}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {row.departmentName ?? "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {row.hodRecommendation ? (
                              <div className="grid gap-0.5">
                                <p>{row.hodRecommendation.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatHistoryDate(row.hodRecommendation.recommendedAt)}
                                </p>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <RequisitionStatusBadge statusGroup={statusGroupFromDb(row.status)} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequisitionId(row.requisitionId)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !isLoading && !isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          No requisitions awaiting verification.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <VerifyDialog
        requisitionId={selectedRequisitionId}
        open={selectedRequisitionId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequisitionId(null);
        }}
        onVerify={handleVerify}
        onReject={(item) => setConfirmRejectItem(item)}
        isSubmitting={verifyMutation.isPending}
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
            <Label htmlFor="adminRejectRemarks">Rejection remarks</Label>
            <Textarea
              id="adminRejectRemarks"
              placeholder="Explain why this requisition is being rejected…"
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              maxLength={500}
              rows={4}
              disabled={verifyMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">{rejectRemarks.length}/500 characters</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verifyMutation.isPending} onClick={closeRejectDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={verifyMutation.isPending || !rejectRemarks.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleRejectConfirm();
              }}
            >
              {verifyMutation.isPending ? "Rejecting…" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
