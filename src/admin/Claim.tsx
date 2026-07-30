import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Clock, ExternalLink, FileText, History, Loader2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { AdminSidebar } from "@/admin/Sidebar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminClaimSubmission } from "@/lib/requisitionsApi";
import { fetchAdminClaimDetail, fetchAdminClaimQueue, submitAdminClaim } from "@/lib/requisitionsApi";
import { formatHistoryDate, formatProgrammeDates } from "@/lib/requisitionStatus";

function formatRm(amount: number) {
  return `RM ${amount.toFixed(2)}`;
}

const emptyClaimForm: AdminClaimSubmission = {
  actualMileage: "0",
  actualAccommodation: "0",
  actualTravelFare: "0",
  actualOthers: "0",
  notes: "",
  attachment: null,
};

function BudgetTable({
  title,
  budget,
}: {
  title: string;
  budget: { mileage: number; accommodation: number; travelFare: number; others: number; total: number };
}) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
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
              <TableCell className="text-right">{formatRm(budget.mileage)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Accommodation</TableCell>
              <TableCell className="text-right">{formatRm(budget.accommodation)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Travel fare</TableCell>
              <TableCell className="text-right">{formatRm(budget.travelFare)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Programme fees & others</TableCell>
              <TableCell className="text-right">{formatRm(budget.others)}</TableCell>
            </TableRow>
            <TableRow className="bg-muted/30 font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatRm(budget.total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ActualClaimTable({
  form,
  total,
  onChange,
}: {
  form: AdminClaimSubmission;
  total: number;
  onChange: (field: keyof AdminClaimSubmission, value: string) => void;
}) {
  const rows = [
    { key: "actualMileage" as const, label: "Mileage", id: "actualMileage" },
    { key: "actualAccommodation" as const, label: "Accommodation", id: "actualAccommodation" },
    { key: "actualTravelFare" as const, label: "Travel fare", id: "actualTravelFare" },
    { key: "actualOthers" as const, label: "Programme fees & others", id: "actualOthers" },
  ];

  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actual claim</p>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-[160px] text-right">Amount (RM)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <Label htmlFor={row.id} className="font-normal">
                    {row.label}
                  </Label>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    id={row.id}
                    type="number"
                    min="0"
                    step="0.01"
                    className="ml-auto h-8 w-36 text-right tabular-nums"
                    value={form[row.key] ?? "0"}
                    onChange={(e) => onChange(row.key, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{formatRm(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type ClaimDialogProps = {
  requisitionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnSave?: boolean;
};

export function ClaimDialog({ requisitionId, open, onOpenChange, closeOnSave = false }: ClaimDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<AdminClaimSubmission>(emptyClaimForm);

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "claim-detail", requisitionId],
    queryFn: () => fetchAdminClaimDetail(requisitionId!),
    enabled: open && requisitionId != null,
  });

  React.useEffect(() => {
    if (!item) return;
    setForm(
      item.actualClaim
        ? {
            actualMileage: String(item.actualClaim.mileage),
            actualAccommodation: String(item.actualClaim.accommodation),
            actualTravelFare: String(item.actualClaim.travelFare),
            actualOthers: String(item.actualClaim.others),
            notes: item.actualClaim.notes ?? "",
            attachment: null,
          }
        : { ...emptyClaimForm, notes: "", attachment: null },
    );
  }, [item]);

  const claimMutation = useMutation({
    mutationFn: () => submitAdminClaim(requisitionId!, form),
    onSuccess: (result) => {
      toast.success(result.message);
      setForm((prev) => ({ ...prev, attachment: null }));
      queryClient.invalidateQueries({ queryKey: ["requisitions", "admin", "claim-queue"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "admin", "claim-history"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions", "admin", "claim-detail", requisitionId] });
      if (closeOnSave) onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to save the actual claim.");
    },
  });

  const actualTotal =
    Number.parseFloat(form.actualMileage || "0") +
    Number.parseFloat(form.actualAccommodation || "0") +
    Number.parseFloat(form.actualTravelFare || "0") +
    Number.parseFloat(form.actualOthers || "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load claim details."}
          </p>
        ) : item ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
                <div className="min-w-0 grid gap-1">
                  <DialogTitle className="text-left">{item.title || "Untitled programme"}</DialogTitle>
                  <DialogDescription className="text-left">
                    {item.id} · {item.staffName} · {item.departmentName ?? "—"}
                  </DialogDescription>
                </div>
                <Badge
                  variant={item.claimed ? "default" : "secondary"}
                  className={item.claimed ? "bg-green-600 hover:bg-green-600/90 dark:bg-green-700" : ""}
                >
                  {item.claimed ? "Claim recorded" : "Awaiting claim"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-4 text-sm">
              <p className="text-sm text-muted-foreground">
                Programme dates: {formatProgrammeDates(item.programmeDates)}
              </p>

              <BudgetTable title="Staff claim (requested budget)" budget={item.staffClaim} />

              <Separator />

              {item.claimed && item.actualClaim ? (
                <div className="grid gap-4">
                  <BudgetTable title="Actual claim" budget={item.actualClaim} />

                  {item.actualClaim.attachmentUrl ? (
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Claim attachment
                      </p>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/10 px-3 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {item.actualClaim.attachmentFileName ?? "Attached document"}
                        </span>
                        <Button type="button" variant="link" className="h-auto px-1 text-xs" asChild>
                          <a href={item.actualClaim.attachmentUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {item.actualClaim.notes ? (
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                      <p className="whitespace-pre-wrap rounded-md border bg-muted/10 p-3 text-sm">
                        {item.actualClaim.notes}
                      </p>
                    </div>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    Recorded
                    {item.actualClaim.recordedBy ? ` by ${item.actualClaim.recordedBy}` : ""} on{" "}
                    {formatHistoryDate(item.actualClaim.recordedAt)}
                  </p>
                </div>
              ) : (
                <form
                  className="grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    claimMutation.mutate();
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Record actual claim</p>
                    <p className="text-sm text-muted-foreground">
                      Enter the actual amount claimed after the staff attended the training. Optionally attach the
                      claim record document.
                    </p>
                  </div>

                  <ActualClaimTable
                    form={form}
                    total={actualTotal}
                    onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                  />

                  <div className="grid gap-2">
                    <Label htmlFor="claimAttachment">Claim attachment (optional)</Label>
                    <label
                      htmlFor="claimAttachment"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center transition-colors hover:bg-muted/40"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {form.attachment ? form.attachment.name : "Choose a file to upload"}
                      </span>
                      <span className="text-xs text-muted-foreground">PDF or image, up to 10 MB</span>
                      <Input
                        id="claimAttachment"
                        type="file"
                        accept=".pdf,image/*"
                        className="sr-only"
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] ?? null }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="claimNotes">Notes (optional)</Label>
                    <Textarea
                      id="claimNotes"
                      value={form.notes ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      maxLength={500}
                      rows={3}
                      placeholder="Add any remarks about this claim…"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={claimMutation.isPending}>
                      {claimMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save actual claim"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AdminClaimPage() {
  const [selectedRequisitionId, setSelectedRequisitionId] = React.useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "claim-queue"],
    queryFn: fetchAdminClaimQueue,
  });

  const rows = data?.requisitions ?? [];
  const summary = data?.summary ?? { total: 0, pending: 0, claimed: 0 };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Claim</h1>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Post-training claims</CardTitle>
                <CardDescription>
                  Attach the actual claim amount after staff attend a training. This does not affect how staff earn
                  CPD hours.
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/admin/claim/history">
                  <History className="h-4 w-4" />
                  History
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <Badge variant="secondary" className="tabular-nums">
                    {summary.pending}
                  </Badge>
                  awaiting claim
                </span>
              </div>

              {isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unable to load claim queue."}
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
                      <TableHead className="text-right">Staff claim</TableHead>
                      <TableHead className="text-right">Actual claim</TableHead>
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
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {row.departmentName ?? "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatRm(row.staffClaim.total)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequisitionId(row.requisitionId)}
                            >
                              Record
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !isLoading && !isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          No requisitions awaiting claim.
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

      <ClaimDialog
        requisitionId={selectedRequisitionId}
        open={selectedRequisitionId != null}
        closeOnSave
        onOpenChange={(open) => {
          if (!open) setSelectedRequisitionId(null);
        }}
      />
    </main>
  );
}
