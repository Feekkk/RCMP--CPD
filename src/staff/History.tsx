import * as React from "react";
import { History as HistoryIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffSidebar } from "@/staff/Sidebar";

type HistoryStatus = "submitted" | "pending" | "approved" | "rejected";
type HistoryItem = {
  id: string;
  title: string;
  category: string;
  submittedAt: string;
  totalBudget: number;
  status: HistoryStatus;
};

const STATUS_LABEL: Record<HistoryStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: HistoryStatus }) {
  const variant =
    status === "approved" ? "default" : status === "rejected" ? "destructive" : status === "pending" ? "outline" : "outline";

  const pendingClassName =
    status === "pending"
      ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
      : undefined;

  return (
    <Badge variant={variant} className={pendingClassName}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function History() {
  const [statusFilter, setStatusFilter] = React.useState<HistoryStatus | "all">("all");

  const items = React.useMemo<HistoryItem[]>(
    () => [
      { id: "REQ-0007", title: "Professional Scrum Master I", category: "Certification", submittedAt: "2026-04-21", totalBudget: 450, status: "approved" },
      { id: "REQ-0008", title: "React Performance Workshop", category: "Workshop", submittedAt: "2026-04-23", totalBudget: 180, status: "pending" },
      { id: "REQ-0009", title: "Data Governance Summit", category: "Conference", submittedAt: "2026-04-25", totalBudget: 0, status: "submitted" },
      { id: "REQ-0010", title: "Leadership Essentials", category: "Training / Course", submittedAt: "2026-04-27", totalBudget: 320, status: "rejected" },
    ],
    [],
  );

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HistoryIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
              </div>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Requisition history</CardTitle>
                <CardDescription>Filter your requisitions by status.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as HistoryStatus | "all")}>
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
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length ? (
                        filtered.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.id}</TableCell>
                            <TableCell>
                              <div className="grid gap-1">
                                <p className="font-medium leading-none">{row.title}</p>
                                <p className="text-sm text-muted-foreground md:hidden">{row.category}</p>
                                <p className="text-sm text-muted-foreground md:hidden">Submitted: {row.submittedAt}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{row.category}</TableCell>
                            <TableCell className="hidden md:table-cell">{row.submittedAt}</TableCell>
                            <TableCell className="text-right">{row.totalBudget.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <StatusBadge status={row.status} />
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
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}

