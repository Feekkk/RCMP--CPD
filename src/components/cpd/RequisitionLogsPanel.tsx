import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, ScrollText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRequisitionHistory } from "@/lib/requisitionsApi";
import { formatHistoryDate, formatRequisitionId, statusDetailLabel } from "@/lib/requisitionStatus";

const PAGE_SIZE = 20;

export function RequisitionLogsPanel() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["requisitions", "history", "staff-logs", page],
    queryFn: () => fetchRequisitionHistory({ phase: "all", page, pageSize: PAGE_SIZE }),
  });

  const rows = data?.requisitions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const safePage = data?.page ?? 1;

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Requisition logs
          </CardTitle>
          <CardDescription>
            Your requisitions with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load logs</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading requisition logs…
            </div>
          ) : isError ? null : rows.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last updated</TableHead>
                    <TableHead>Requisition</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="hidden md:table-cell">Submitted at</TableHead>
                    <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.requisitionId}>
                      <TableCell className="whitespace-nowrap text-sm">
                        <span className="font-medium text-foreground">{formatHistoryDate(row.updatedAt)}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatRequisitionId(row.requisitionId)}</p>
                        <p className="max-w-[12rem] truncate text-xs text-muted-foreground sm:max-w-xs">
                          {row.title}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">
                        {statusDetailLabel(row.status)}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate text-sm">{row.venue}</TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm md:table-cell">
                        {formatHistoryDate(row.submittedAt)}
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground lg:table-cell">
                        {row.rejectionRemarks ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
              No requisitions recorded yet.
            </div>
          )}

          {!isLoading && total > 0 ? (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{rows.length}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span>
                {isFetching ? <span className="ml-2 text-xs">Updating…</span> : null}
              </p>
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
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
