import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchRequisitionHistory } from "@/lib/requisitionsApi";
import { formatHistoryDate, type HistoryStatusFilter } from "@/lib/requisitionStatus";

const STATUS_TABS: { value: HistoryStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

type RequisitionHistoryPanelProps = {
  description: string;
  showStaffColumn?: boolean;
  showBudgetColumn?: boolean;
  showActions?: boolean;
  pageSize?: number;
};

export function RequisitionHistoryPanel({
  description,
  showStaffColumn = false,
  showBudgetColumn = false,
  showActions = false,
  pageSize = 10,
}: RequisitionHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = React.useState<HistoryStatusFilter>("all");
  const [page, setPage] = React.useState(1);
  const paginated = pageSize < 100;

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["requisitions", "history", statusFilter, page, pageSize],
    queryFn: () =>
      fetchRequisitionHistory({
        status: statusFilter,
        page,
        pageSize,
      }),
  });

  const rows = data?.requisitions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const safePage = data?.page ?? 1;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Requisition history</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as HistoryStatusFilter)}>
          <TabsList className="w-full justify-start">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load history</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Programme</TableHead>
                {showStaffColumn ? <TableHead className="hidden md:table-cell">Staff</TableHead> : null}
                {!showStaffColumn && showBudgetColumn ? (
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                ) : null}
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                {showBudgetColumn ? <TableHead className="text-right">Budget</TableHead> : null}
                <TableHead className="text-right">Status</TableHead>
                {showActions ? <TableHead className="w-[100px] text-right">Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 7 : showStaffColumn || showBudgetColumn ? 6 : 5} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading requisitions…
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.requisitionId}>
                    <TableCell className="font-medium">{row.id}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <p className="font-medium leading-none">{row.title || "Untitled"}</p>
                        {showStaffColumn ? (
                          <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground md:hidden">{row.category}</p>
                        )}
                        <p className="text-sm text-muted-foreground md:hidden">
                          Submitted: {formatHistoryDate(row.submittedAt)}
                        </p>
                      </div>
                    </TableCell>
                    {showStaffColumn ? (
                      <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                    ) : showBudgetColumn ? (
                      <TableCell className="hidden md:table-cell">{row.category}</TableCell>
                    ) : null}
                    <TableCell className="hidden md:table-cell">{formatHistoryDate(row.submittedAt)}</TableCell>
                    {showBudgetColumn ? (
                      <TableCell className="text-right">{row.totalBudget.toFixed(2)}</TableCell>
                    ) : null}
                    <TableCell className="text-right">
                      <RequisitionStatusBadge statusGroup={row.statusGroup} />
                    </TableCell>
                    {showActions ? (
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" disabled>
                          View
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 7 : showStaffColumn || showBudgetColumn ? 6 : 5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No requisitions found for this status.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {paginated ? (
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Total requisitions: <span className="font-medium text-foreground">{total}</span>
                {isFetching && !isLoading ? <span className="ml-2 text-xs">Updating…</span> : null}
              </p>
              {total > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={safePage <= 1 || isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={safePage >= totalPages || isFetching}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
