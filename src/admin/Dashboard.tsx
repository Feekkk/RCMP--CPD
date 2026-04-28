import { CheckCircle2, Clock, FileText, LayoutDashboard, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/admin/Sidebar";

export const AdminDashboardPage = () => {
  const pendingApprovals = 7;
  const approvedThisMonth = 14;
  const rejectedThisMonth = 2;
  const totalThisMonth = pendingApprovals + approvedThisMonth + rejectedThisMonth;
  const approvalRate = totalThisMonth ? Math.round((approvedThisMonth / totalThisMonth) * 100) : 0;

  const stats = [
    { label: "Pending approvals", value: `${pendingApprovals}`, icon: Clock },
    { label: "Approved (month)", value: `${approvedThisMonth}`, icon: CheckCircle2 },
    { label: "Rejected (month)", value: `${rejectedThisMonth}`, icon: TrendingUp },
    { label: "Active staff", value: "193", icon: Users },
  ] as const;

  type RecentStatus = "submitted" | "pending" | "approved" | "rejected";
  const recent: Array<{ id: string; staff: string; title: string; submittedAt: string; status: RecentStatus }> = [
    { id: "REQ-0011", staff: "Wan Afiq", title: "Advanced Teaching Workshop", submittedAt: "Apr 28, 2026", status: "pending" },
    { id: "REQ-0010", staff: "Nur Syafiqah", title: "Leadership Essentials", submittedAt: "Apr 27, 2026", status: "rejected" },
    { id: "REQ-0009", staff: "Aiman Hakim", title: "Data Governance Summit", submittedAt: "Apr 25, 2026", status: "submitted" },
    { id: "REQ-0008", staff: "Siti Aisyah", title: "React Performance Workshop", submittedAt: "Apr 23, 2026", status: "pending" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:inline-flex">
                <Users className="h-4 w-4" />
                Manage users
              </Button>
              <Button>
                <FileText className="h-4 w-4" />
                Review requisitions
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
                <CardTitle>Approvals overview</CardTitle>
                <CardDescription>Monitor approvals performance for the month.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Approval rate</p>
                    <p className="font-display text-3xl font-bold">
                      {approvalRate}% <span className="text-muted-foreground">/ 100%</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="h-6">
                    {approvedThisMonth}/{totalThisMonth} approved
                  </Badge>
                </div>
                <Progress value={approvalRate} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</p>
                    <p className="mt-2 text-lg font-semibold">{pendingApprovals}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Approved</p>
                    <p className="mt-2 text-lg font-semibold">{approvedThisMonth}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rejected</p>
                    <p className="mt-2 text-lg font-semibold">{rejectedThisMonth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Admin shortcuts for daily review.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" className="w-full justify-start">
                  <LayoutDashboard className="h-4 w-4" />
                  View dashboard
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4" />
                  Pending requisitions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4" />
                  User management
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent submissions</CardTitle>
                <CardDescription>Latest requisitions submitted by staff.</CardDescription>
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
                      {recent.map((row) => (
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

