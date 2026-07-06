import { CheckCircle2, Clock, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { ApprovalSidebar } from "@/approval/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTodayDate } from "@/lib/requisitionStatus";

export function ApprovalDashboardPage() {
  const stats = [
    { label: "Pending approval", value: "5", icon: Clock },
    { label: "Approved (month)", value: "12", icon: CheckCircle2 },
    { label: "Rejected (month)", value: "1", icon: TrendingUp },
    { label: "Verified queue", value: "5", icon: FileText },
  ] as const;

  type RecentStatus = "verified" | "approved" | "rejected";
  const recent: Array<{ id: string; staff: string; title: string; submittedAt: string; status: RecentStatus }> = [
    { id: "REQ-0012", staff: "Wan Afiq", title: "Advanced Teaching Workshop", submittedAt: "Apr 29, 2026", status: "verified" },
    { id: "REQ-0011", staff: "Nur Syafiqah", title: "Leadership Essentials", submittedAt: "Apr 28, 2026", status: "verified" },
    { id: "REQ-0010", staff: "Aiman Hakim", title: "Data Governance Summit", submittedAt: "Apr 27, 2026", status: "approved" },
    { id: "REQ-0009", staff: "Siti Aisyah", title: "React Performance Workshop", submittedAt: "Apr 25, 2026", status: "verified" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <ApprovalSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{formatTodayDate()}</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <Button asChild>
              <Link to="/approval/approval">
                <FileText className="h-4 w-4" />
                Review queue
              </Link>
            </Button>
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pending final approval</CardTitle>
              <CardDescription>Requisitions verified by HR and awaiting dean approval.</CardDescription>
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
                                  : "outline"
                            }
                            className={
                              row.status === "verified"
                                ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
                                : undefined
                            }
                          >
                            {row.status === "verified"
                              ? "Awaiting approval"
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
    </main>
  );
}
