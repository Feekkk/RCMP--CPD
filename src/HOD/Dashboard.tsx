import { Link } from "react-router-dom";
import { Award, CheckCircle2, ClipboardList, Clock, FileText, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HODSidebar } from "@/HOD/Sidebar";

function CircularProgress({ percent, size = 128, stroke = 10 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-muted/40"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export const HODDashboardPage = () => {
  const reviewQueue = 5;
  const pendingDept = 3;
  const approvedMonth = 11;
  const teamMembers = 24;
  const reviewedTotal = reviewQueue + approvedMonth + 2;
  const clearanceRate = reviewedTotal ? Math.round((approvedMonth / reviewedTotal) * 100) : 0;

  const myCpdCompleted = 14;
  const myCpdTarget = 40;
  const myCpdPercent = myCpdTarget ? Math.round((myCpdCompleted / myCpdTarget) * 100) : 0;

  const stats = [
    { label: "Review queue", value: `${reviewQueue}`, icon: ClipboardList },
    { label: "Dept. pending", value: `${pendingDept}`, icon: Clock },
    { label: "Approved (month)", value: `${approvedMonth}`, icon: CheckCircle2 },
    { label: "Team members", value: `${teamMembers}`, icon: Users },
  ] as const;

  type RowStatus = "submitted" | "pending" | "approved" | "rejected";
  const queuePreview: Array<{ id: string; staff: string; title: string; submittedAt: string; status: RowStatus }> = [
    { id: "REQ-0011", staff: "Wan Afiq", title: "Advanced Teaching Workshop", submittedAt: "Apr 28, 2026", status: "pending" },
    { id: "REQ-0010", staff: "Nur Syafiqah", title: "Leadership Essentials", submittedAt: "Apr 27, 2026", status: "pending" },
    { id: "REQ-0009", staff: "Aiman Hakim", title: "Data Governance Summit", submittedAt: "Apr 25, 2026", status: "submitted" },
    { id: "REQ-0008", staff: "Siti Aisyah", title: "React Performance Workshop", submittedAt: "Apr 23, 2026", status: "pending" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link to="/hod/requisitions">
                  <FileText className="h-4 w-4" />
                  Requisitions
                </Link>
              </Button>
              <Button asChild>
                <Link to="/hod/review-queue">
                  <ClipboardList className="h-4 w-4" />
                  Review queue
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Academic year 2025/2026</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Track endorsements and outcomes for your department this month.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Clearance rate</p>
                    <p className="font-display text-3xl font-bold">
                      {clearanceRate}% <span className="text-muted-foreground">/ 100%</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="h-6">
                    {approvedMonth} approved · {reviewQueue} in queue
                  </Badge>
                </div>
                <Progress value={clearanceRate} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In queue</p>
                    <p className="mt-2 text-lg font-semibold">{reviewQueue}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Approved</p>
                    <p className="mt-2 text-lg font-semibold">{approvedMonth}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Returned</p>
                    <p className="mt-2 text-lg font-semibold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  My progress
                </CardTitle>
                <CardDescription>Your CPD hours toward the annual requirement.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <CircularProgress percent={myCpdPercent} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="font-display text-3xl font-bold leading-none">{myCpdPercent}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {myCpdCompleted}h / {myCpdTarget}h
                    </p>
                  </div>
                </div>
                <div className="grid w-full gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="font-medium">10h</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">4h</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium">{myCpdTarget - myCpdCompleted}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Review queue preview</CardTitle>
                  <CardDescription>Items awaiting your department review.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/hod/review-queue">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">ID</TableHead>
                        <TableHead>Programme</TableHead>
                        <TableHead className="hidden md:table-cell">Staff</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queuePreview.map((row) => (
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
                            <Badge
                              variant={
                                row.status === "approved"
                                  ? "default"
                                  : row.status === "rejected"
                                    ? "destructive"
                                    : row.status === "pending"
                                      ? "outline"
                                      : "secondary"
                              }
                              className={
                                row.status === "pending"
                                  ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
                                  : undefined
                              }
                            >
                              {row.status === "submitted"
                                ? "Submitted"
                                : row.status === "pending"
                                  ? "Pending"
                                  : row.status === "approved"
                                    ? "Approved"
                                    : "Rejected"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};
