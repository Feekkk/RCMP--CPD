import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, History, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminSidebar } from "@/admin/Sidebar";
import { ClaimDialog } from "@/admin/Claim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAdminClaimHistory } from "@/lib/requisitionsApi";
import { formatHistoryDate } from "@/lib/requisitionStatus";

function formatRm(amount: number) {
  return `RM ${amount.toFixed(2)}`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthOptions(count = 18) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

export function AdminClaimHistoryPage() {
  const [selectedRequisitionId, setSelectedRequisitionId] = React.useState<number | null>(null);
  const [month, setMonth] = React.useState(currentMonthKey);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "claim-history", month],
    queryFn: () => fetchAdminClaimHistory(month),
  });

  const rows = data?.requisitions ?? [];
  const total = data?.summary.total ?? 0;
  const selectedMonthLabel =
    MONTH_OPTIONS.find((option) => option.value === month)?.label ?? month;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Claim History</h1>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/claim">
                <ArrowLeft className="h-4 w-4" />
                Back to Claim
              </Link>
            </Button>
          </div>

          <Card className="mt-6">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Recorded actual claims</CardTitle>
                <CardDescription>
                  Requisitions where an actual claim amount has already been attached by admin.
                </CardDescription>
              </div>
              <div className="grid w-full gap-2 sm:w-56">
                <Label htmlFor="claimHistoryMonth" className="text-xs text-muted-foreground">
                  Filter by month
                </Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger id="claimHistoryMonth">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="tabular-nums">
                  {total}
                </Badge>
                <span>
                  {total === 1 ? "claim" : "claims"} in {selectedMonthLabel}
                </span>
              </div>

              {isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unable to load claim history."}
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
                      <TableHead className="hidden sm:table-cell">Recorded</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
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
                              {row.actualClaim ? (
                                <p className="text-sm text-muted-foreground sm:hidden">
                                  {formatHistoryDate(row.actualClaim.recordedAt)}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {row.departmentName ?? "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatRm(row.staffClaim.total)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRm(row.actualClaim!.total)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {row.actualClaim ? formatHistoryDate(row.actualClaim.recordedAt) : "—"}
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
                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                            No actual claims recorded in {selectedMonthLabel}.
                          </div>
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
        onOpenChange={(open) => {
          if (!open) setSelectedRequisitionId(null);
        }}
      />
    </main>
  );
}
