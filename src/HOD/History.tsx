import * as React from "react";
import { ChevronLeft, ChevronRight, History as HistoryIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HODSidebar } from "@/HOD/Sidebar";

const PAGE_SIZE = 10;

type HodHistoryStatus = "submitted" | "pending" | "approved" | "rejected";
type HodHistoryItem = {
  id: string;
  staff: string;
  title: string;
  submittedAt: string;
  status: HodHistoryStatus;
};

function StatusBadge({ status }: { status: HodHistoryStatus }) {
  const variant =
    status === "approved" ? "default" : status === "rejected" ? "destructive" : status === "pending" ? "outline" : "secondary";

  return (
    <Badge
      variant={variant}
      className={
        status === "pending"
          ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
          : undefined
      }
    >
      {status === "submitted" ? "Submitted" : status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected"}
    </Badge>
  );
}

export function HODHistoryPage() {
  const [statusFilter, setStatusFilter] = React.useState<HodHistoryStatus | "all">("all");
  const [page, setPage] = React.useState(1);

  const items: HodHistoryItem[] = [
    { id: "REQ-0011", staff: "Wan Afiq", title: "Advanced Teaching Workshop", submittedAt: "2026-04-28", status: "pending" },
    { id: "REQ-0010", staff: "Nur Syafiqah", title: "Leadership Essentials", submittedAt: "2026-04-27", status: "rejected" },
    { id: "REQ-0009", staff: "Aiman Hakim", title: "Data Governance Summit", submittedAt: "2026-04-25", status: "submitted" },
    { id: "REQ-0007", staff: "Siti Aisyah", title: "Professional Scrum Master I", submittedAt: "2026-04-21", status: "approved" },
  ];

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  React.useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const pageRows = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Requisition history</CardTitle>
              <CardDescription>Filter department requisitions by status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as HodHistoryStatus | "all")}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="submitted">Submitted</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead className="hidden md:table-cell">Staff</TableHead>
                      <TableHead className="hidden md:table-cell">Submitted</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length ? (
                      pageRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staff}</p>
                              <p className="text-sm text-muted-foreground md:hidden">Submitted: {row.submittedAt}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staff}</TableCell>
                          <TableCell className="hidden md:table-cell">{row.submittedAt}</TableCell>
                          <TableCell className="text-right">
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="outline" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          No requisitions found for this status.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Total requisitions: <span className="font-medium text-foreground">{total}</span>
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
                          disabled={safePage <= 1}
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
                          disabled={safePage >= totalPages}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
