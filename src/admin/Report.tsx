import { ArrowUpRight, BarChart3, FileText, Loader2, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/admin/Sidebar";
import { buildExecutiveSnapshot } from "@/lib/reportSnapshot";
import { fetchAdminReportStats } from "@/lib/requisitionsApi";

const reportMonth = new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" });

function departmentRiskBadgeClass(risk: "Low" | "Moderate" | "High") {
  if (risk === "Moderate") {
    return "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300";
  }
  if (risk === "Low") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300";
  }
  return undefined;
}

export function AdminReportPage() {
  const [departmentSearch, setDepartmentSearch] = React.useState("");
  const { data: reportStats, isLoading: isReportLoading } = useQuery({
    queryKey: ["requisitions", "admin", "report-stats"],
    queryFn: fetchAdminReportStats,
  });

  const totalStaff = reportStats?.totalStaff ?? 0;
  const compliantStaff = reportStats?.compliantStaff ?? 0;
  const approvedClaims = reportStats?.approvedRequisitionsThisMonth ?? 0;
  const submittedClaims = reportStats?.submittedRequisitionsThisMonth ?? 0;
  const totalHours = reportStats?.totalTrainingHours ?? 0;
  const participantsThisMonth = reportStats?.participantsThisMonth ?? 0;
  const cpdTargetHours = reportStats?.cpdTargetHours ?? 40;
  const academicDivision = reportStats?.divisionHours.academic ?? {
    staffCount: 0,
    totalHours: 0,
    averageHours: 0,
    targetHours: cpdTargetHours,
  };
  const servicesDivision = reportStats?.divisionHours.services ?? {
    staffCount: 0,
    totalHours: 0,
    averageHours: 0,
    targetHours: cpdTargetHours,
  };
  const allDepartments = reportStats?.departments ?? [];
  const topDepartments = reportStats?.topDepartments ?? [];
  const monthlyTrend = reportStats?.monthlyTrend ?? [];

  const departmentSearchLower = departmentSearch.trim().toLowerCase();
  const isDepartmentSearchActive = departmentSearchLower.length > 0;
  const visibleDepartments = React.useMemo(() => {
    if (!isDepartmentSearchActive) return topDepartments;
    const source = allDepartments.length > 0 ? allDepartments : topDepartments;
    return source.filter((row) => row.departmentName.toLowerCase().includes(departmentSearchLower));
  }, [allDepartments, departmentSearchLower, isDepartmentSearchActive, topDepartments]);

  const complianceRate = totalStaff ? Math.round((compliantStaff / totalStaff) * 100) : 0;
  const approvalRate = submittedClaims ? Math.round((approvedClaims / submittedClaims) * 100) : 0;
  const participantRate = totalStaff ? Math.round((participantsThisMonth / totalStaff) * 100) : 0;
  const maxTrendHours = monthlyTrend.length ? Math.max(...monthlyTrend.map((item) => item.hours), 1) : 1;
  const strongestMonth = monthlyTrend.reduce(
    (best, item) => (item.hours > best.hours ? item : best),
    monthlyTrend[0] ?? { month: "", hours: 0 },
  );

  const snapshot = buildExecutiveSnapshot({
    totalStaff,
    compliantStaff,
    complianceRate,
    approvalRate,
    submittedClaims,
    totalHours,
    departments: allDepartments.length ? allDepartments : topDepartments,
  });

  const summaryCards = [
    {
      label: "CPD compliant staff",
      value: `${compliantStaff}/${totalStaff}`,
      hint: `${complianceRate}% reached minimum yearly target`,
      icon: ShieldCheck,
    },
    {
      label: "Approved requisitions",
      value: `${approvedClaims}`,
      hint: `${approvalRate}% approval rate this month`,
      icon: FileText,
    },
    {
      label: "Training hours logged",
      value: `${totalHours}h`,
      hint: "Across internal and external programmes",
      icon: TrendingUp,
    },
    {
      label: "Participants this month",
      value: `${participantsThisMonth}`,
      hint: `${participantRate}% of staff scheduled for training`,
      icon: Users,
    },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">Management Report</h1>
                  <p className="text-sm text-muted-foreground">Executive summary for {reportMonth}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background">
            <CardContent className="p-6">
              <div className="max-w-2xl space-y-3">
                <Badge variant="secondary" className="w-fit">
                  Monthly executive snapshot
                </Badge>
                {isReportLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing snapshot…
                  </div>
                ) : (
                  <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">{snapshot.headline}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{snapshot.detail}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">
                    {isReportLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Average hours attended</CardTitle>
              <CardDescription>CPD hours logged per staff member, split by Academic and Services divisions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Academic division</p>
                      <p className="font-display text-3xl font-bold">
                        {isReportLoading ? (
                          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        ) : (
                          `${academicDivision.totalHours}h`
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary">{academicDivision.staffCount} staff</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {academicDivision.averageHours}h average per staff member.
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Services division</p>
                      <p className="font-display text-3xl font-bold">
                        {isReportLoading ? (
                          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        ) : (
                          `${servicesDivision.totalHours}h`
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{servicesDivision.staffCount} staff</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {servicesDivision.averageHours}h average per staff member.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Academic avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : `${academicDivision.averageHours}h`}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Services avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : `${servicesDivision.averageHours}h`}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overall avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      `${totalStaff ? Math.round((totalHours / totalStaff) * 10) / 10 : 0}h`
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Department performance</CardTitle>
                  <CardDescription>
                    {isDepartmentSearchActive
                      ? `Showing ${visibleDepartments.length} matching department${visibleDepartments.length === 1 ? "" : "s"} from all units.`
                      : "Top 5 departments by CPD completion rate. Search to view any other department."}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    placeholder="Search department…"
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isReportLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allDepartments.length === 0 && topDepartments.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center">
                    <p className="font-medium text-foreground">No department data yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Departments will appear once staff log CPD hours.</p>
                  </div>
                ) : visibleDepartments.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center">
                    <p className="font-medium text-foreground">No departments match</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try another name for &ldquo;{departmentSearch.trim()}&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead className="hidden md:table-cell">Staff</TableHead>
                          <TableHead>Completion</TableHead>
                          <TableHead className="hidden md:table-cell">Avg hours</TableHead>
                          <TableHead className="text-right">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleDepartments.map((row) => (
                          <TableRow key={row.departmentId}>
                            <TableCell className="font-medium">{row.departmentName}</TableCell>
                            <TableCell className="hidden md:table-cell">{row.staffCount}</TableCell>
                            <TableCell>
                              <div className="min-w-[140px] space-y-2">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span>{row.completion}%</span>
                                  <span className="text-muted-foreground">{row.staffCount} staff</span>
                                </div>
                                <Progress value={row.completion} />
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{row.avgHours}h</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={row.risk === "High" ? "destructive" : "outline"}
                                className={departmentRiskBadgeClass(row.risk)}
                              >
                                {row.risk}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Monthly learning trend</CardTitle>
                <CardDescription>Total CPD hours recorded over the last 4 months.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isReportLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {monthlyTrend.map((item) => (
                      <div key={item.monthKey} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.month}</span>
                          <span className="text-muted-foreground">{item.hours}h</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted">
                          <div
                            className="h-3 rounded-full bg-primary"
                            style={{ width: `${Math.round((item.hours / maxTrendHours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {strongestMonth.hours > 0 ? (
                      <div className="rounded-xl border bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                          {strongestMonth.month} recorded the strongest learning activity in this period.
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
