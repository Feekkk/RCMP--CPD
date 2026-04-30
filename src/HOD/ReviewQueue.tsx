import { ClipboardList, Clock, ThumbsUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HODSidebar } from "@/HOD/Sidebar";

type QueueStatus = "pending" | "recommended";

type QueueRow = {
  id: string;
  staff: string;
  title: string;
  category: string;
  submittedAt: string;
  hodStatus: QueueStatus;
};

function HodQueueBadge({ status }: { status: QueueStatus }) {
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
      Pending
    </Badge>
  );
}

export function HODReviewQueuePage() {
  const rows: QueueRow[] = [
    {
      id: "REQ-0014",
      staff: "Al Amin",
      title: "AI in Higher Education Symposium",
      category: "Conference",
      submittedAt: "2026-04-29",
      hodStatus: "pending",
    },
    {
      id: "REQ-0013",
      staff: "Wan Afiq",
      title: "Advanced Teaching Workshop",
      category: "Workshop",
      submittedAt: "2026-04-28",
      hodStatus: "pending",
    },
    {
      id: "REQ-0012",
      staff: "Abd Hadi",
      title: "Leadership Essentials",
      category: "Training / Course",
      submittedAt: "2026-04-27",
      hodStatus: "recommended",
    },
    {
      id: "REQ-0011",
      staff: "Aiman Hakim",
      title: "Data Governance Summit",
      category: "Conference",
      submittedAt: "2026-04-25",
      hodStatus: "pending",
    },
    {
      id: "REQ-0010",
      staff: "Siti Aisyah",
      title: "Professional Scrum Master I",
      category: "Certification",
      submittedAt: "2026-04-22",
      hodStatus: "recommended",
    },
    {
      id: "REQ-0009",
      staff: "Hafiz Rahman",
      title: "Research Ethics Refresher",
      category: "Seminar",
      submittedAt: "2026-04-18",
      hodStatus: "recommended",
    },
  ];

  const total = rows.length;
  const pending = rows.filter((r) => r.hodStatus === "pending").length;
  const recommend = rows.filter((r) => r.hodStatus === "recommended").length;

  const summaryCards = [
    {
      label: "Total",
      value: total,
      hint: "In your queue",
      icon: ClipboardList,
      iconClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      label: "Pending",
      value: pending,
      hint: "Awaiting your review",
      icon: Clock,
      iconClass: "text-amber-700 dark:text-amber-400",
      bgClass: "bg-amber-500/15",
    },
    {
      label: "Recommend",
      value: recommend,
      hint: "Endorsed forward",
      icon: ThumbsUp,
      iconClass: "text-emerald-700 dark:text-emerald-400",
      bgClass: "bg-emerald-500/15",
    },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />
      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Review Queue</h1>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {summaryCards.map((c) => (
              <Card key={c.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bgClass}`}>
                    <c.icon className={`h-4 w-4 ${c.iconClass}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">{c.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Department requisitions</CardTitle>
              <CardDescription>Review and recommend staff CPD requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[112px]">ID</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead className="hidden lg:table-cell">Category</TableHead>
                      <TableHead className="hidden md:table-cell">Staff</TableHead>
                      <TableHead className="hidden md:table-cell">Submitted</TableHead>
                      <TableHead className="text-right">HOD status</TableHead>
                      <TableHead className="w-[100px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length ? (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground lg:hidden">{row.category}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staff}</p>
                              <p className="text-sm text-muted-foreground md:hidden">Submitted: {row.submittedAt}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{row.category}</TableCell>
                          <TableCell className="hidden md:table-cell">{row.staff}</TableCell>
                          <TableCell className="hidden md:table-cell">{row.submittedAt}</TableCell>
                          <TableCell className="text-right">
                            <HodQueueBadge status={row.hodStatus} />
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
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          No requisitions in the queue.
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
