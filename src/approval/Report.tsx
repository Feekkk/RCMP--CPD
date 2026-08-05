import { ArrowUpRight, BarChart3, Loader2, ShieldCheck, TrendingUp, Users, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ApprovalSidebar } from "@/approval/Sidebar";
import { InsightStatCard } from "@/components/cpd/InsightStatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildExecutiveSnapshot } from "@/lib/reportSnapshot";
import { fetchApprovalReportStats } from "@/lib/requisitionsApi";

const reportMonth = new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" });

function formatCpdHours(hours: number) {
  const rounded = Math.round(hours * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatRm(amount: number) {
  return `RM ${amount.toFixed(2)}`;
}

function departmentRiskBadgeClass(risk: "Low" | "Moderate" | "High") {
  if (risk === "Moderate") {
    return "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300";
  }
  if (risk === "Low") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300";
  }
  return undefined;
}

export function ApprovalReportPage() {
  const { data: reportStats, isLoading: isReportLoading } = useQuery({
    queryKey: ["requisitions", "approval", "report-stats"],
    queryFn: fetchApprovalReportStats,
  });

  const totalStaff = reportStats?.totalStaff ?? 0;
  const approvedClaims = reportStats?.approvedRequisitionsThisMonth ?? 0;
  const submittedClaims = reportStats?.submittedRequisitionsThisMonth ?? 0;
  const totalHours = reportStats?.totalTrainingHours ?? 0;
  const participantsThisMonth = reportStats?.participantsThisMonth ?? 0;
  const cpdTargetHours = reportStats?.cpdTargetHours ?? 40;
  const academicDivision = reportStats?.divisionHours.academic ?? {
    staffCount: 0,
    compliantCount: 0,
    totalHours: 0,
    averageHours: 0,
    targetHours: cpdTargetHours,
  };
  const servicesDivision = reportStats?.divisionHours.services ?? {
    staffCount: 0,
    compliantCount: 0,
    totalHours: 0,
    averageHours: 0,
    targetHours: cpdTargetHours,
  };
  const topDepartments = reportStats?.topDepartments ?? [];
  const monthlyTrend = reportStats?.monthlyTrend ?? [];

  const academicCompliantStaff = academicDivision.compliantCount;
  const academicStaffCount = academicDivision.staffCount;
  const academicComplianceRate = academicStaffCount
    ? Math.round((academicCompliantStaff / academicStaffCount) * 100)
    : 0;
  const approvalRate = submittedClaims ? Math.round((approvedClaims / submittedClaims) * 100) : 0;
  const participantRate = totalStaff ? Math.round((participantsThisMonth / totalStaff) * 100) : 0;
  const maxTrendAmount = monthlyTrend.length ? Math.max(...monthlyTrend.map((item) => item.amount), 1) : 1;
  const strongestMonth = monthlyTrend.reduce(
    (best, item) => (item.amount > best.amount ? item : best),
    monthlyTrend[0] ?? { month: "", amount: 0 },
  );
  const overallAverage = totalStaff ? Math.round((totalHours / totalStaff) * 10) / 10 : 0;

  const snapshot = buildExecutiveSnapshot({
    totalStaff: academicStaffCount,
    compliantStaff: academicCompliantStaff,
    complianceRate: academicComplianceRate,
    approvalRate,
    submittedClaims,
    totalHours,
    departments: topDepartments,
  });

  const summaryCards = [
    {
      label: "CPD compliant staff",
      value: `${academicCompliantStaff}/${academicStaffCount}`,
      hint: `${academicComplianceRate}% of academic staff reached minimum yearly target`,
      icon: ShieldCheck,
    },
    {
      label: "Approved requisitions",
      value: `${approvedClaims}`,
      hint: `${approvalRate}% approval rate this month`,
      icon: FileText,
    },
    {
      label: "CPD Hours logged",
      value: formatCpdHours(totalHours),
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
      <ApprovalSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Approval</p>
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
            {summaryCards.map((card, index) => (
              <InsightStatCard
                key={card.label}
                title={card.label}
                value={
                  isReportLoading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : card.value
                }
                description={card.hint}
                icon={card.icon}
                featured={index === 0}
              />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Average CPD Hours attended</CardTitle>
              <CardDescription>CPD Hours logged per staff member, split by Academic and Services divisions.</CardDescription>
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
                          formatCpdHours(academicDivision.totalHours)
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary">{academicDivision.staffCount} staff</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatCpdHours(academicDivision.averageHours)} CPD Hours average per staff member.
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
                          formatCpdHours(servicesDivision.totalHours)
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{servicesDivision.staffCount} staff</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatCpdHours(servicesDivision.averageHours)} CPD Hours average per staff member.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Academic avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      formatCpdHours(academicDivision.averageHours)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Services avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      formatCpdHours(servicesDivision.averageHours)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overall avg</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isReportLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      formatCpdHours(overallAverage)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Department performance</CardTitle>
                <CardDescription>Top 5 departments by CPD completion rate.</CardDescription>
              </CardHeader>
              <CardContent>
                {isReportLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : topDepartments.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center">
                    <p className="font-medium text-foreground">No department data yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Departments will appear once staff log CPD Hours.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead className="hidden md:table-cell">Staff</TableHead>
                          <TableHead>Completion</TableHead>
                          <TableHead className="hidden md:table-cell">Avg CPD Hours</TableHead>
                          <TableHead className="text-right">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topDepartments.map((row) => (
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
                            <TableCell className="hidden md:table-cell">{formatCpdHours(row.avgHours)}</TableCell>
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
                <CardTitle>Monthly claim trend</CardTitle>
                <CardDescription>Total actual claims recorded over the last 4 months.</CardDescription>
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
                          <span className="text-muted-foreground">{formatRm(item.amount)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted">
                          <div
                            className="h-3 rounded-full bg-primary"
                            style={{ width: `${Math.round((item.amount / maxTrendAmount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {strongestMonth.amount > 0 ? (
                      <div className="rounded-xl border bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                          {strongestMonth.month} recorded the highest claim amount in this period.
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
