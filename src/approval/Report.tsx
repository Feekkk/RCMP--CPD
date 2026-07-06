import { AlertTriangle, ArrowUpRight, BarChart3, Download, FileText, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { ApprovalSidebar } from "@/approval/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ApprovalReportPage() {
  const reportMonth = "April 2026";
  const totalStaff = 193;
  const compliantStaff = 148;
  const submittedClaims = 61;
  const approvedClaims = 46;
  const totalHours = 4280;
  const budgetUsed = 68400;
  const allocatedBudget = 90000;

  const complianceRate = Math.round((compliantStaff / totalStaff) * 100);
  const approvalRate = Math.round((approvedClaims / submittedClaims) * 100);
  const budgetRate = Math.round((budgetUsed / allocatedBudget) * 100);

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
      label: "Active participants",
      value: "172",
      hint: "89% of staff joined at least one programme",
      icon: Users,
    },
  ] as const;

  const facultyPerformance = [
    { faculty: "Information Technology", staff: 44, completion: 91, avgHours: 28, risk: "Low" },
    { faculty: "Student Development Campus Lifestyle", staff: 36, completion: 84, avgHours: 24, risk: "Moderate" },
    { faculty: "Human Capital Development", staff: 22, completion: 77, avgHours: 21, risk: "Moderate" },
    { faculty: "IIP ", staff: 18, completion: 69, avgHours: 19, risk: "High" },
  ] as const;

  const topProgrammes = [
    { title: "Outcome-Based Education Workshop", attendees: 38, hours: 304, impact: "High" },
    { title: "Digital Records & Governance", attendees: 29, hours: 174, impact: "High" },
    { title: "Leadership for Heads of Unit", attendees: 18, hours: 126, impact: "Medium" },
    { title: "Research Ethics Refresher", attendees: 41, hours: 82, impact: "Medium" },
  ] as const;

  const monthlyTrend = [
    { month: "Jan", hours: 620 },
    { month: "Feb", hours: 710 },
    { month: "Mar", hours: 840 },
    { month: "Apr", hours: 960 },
  ] as const;

  const maxTrendHours = Math.max(...monthlyTrend.map((item) => item.hours));

  const watchlist = [
    "Registry & Quality has the lowest completion rate and needs targeted enrolment.",
    "14 approved staff still have not uploaded completion evidence.",
    "Budget use is healthy, but external seminar spending is trending upward.",
  ];

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
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4" />
                View details
              </Button>
              <Button>
                <Download className="h-4 w-4" />
                Export report
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge variant="secondary" className="w-fit">
                  Monthly executive snapshot
                </Badge>
                <div>
                  <h2 className="font-display text-3xl font-bold tracking-tight">CPD performance is progressing well, with a few units needing intervention.</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Most departments are on track, approval flow is stable, and budget usage remains controlled. The main priority is lifting completion in lower-performing units before the next review cycle.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compliance</p>
                  <p className="mt-2 text-2xl font-bold">{complianceRate}%</p>
                  <p className="text-sm text-muted-foreground">Staff meeting annual target</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Budget used</p>
                  <p className="mt-2 text-2xl font-bold">{budgetRate}%</p>
                  <p className="text-sm text-muted-foreground">RM {budgetUsed.toLocaleString()} of RM {allocatedBudget.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly trend</p>
                  <p className="mt-2 text-2xl font-bold">+14%</p>
                  <p className="text-sm text-muted-foreground">Compared with March activity</p>
                </div>
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
                  <p className="font-display text-2xl font-bold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Compliance and budget overview</CardTitle>
                <CardDescription>Key figures usually raised during a monthly management briefing.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Staff compliance progress</p>
                        <p className="font-display text-3xl font-bold">
                          {complianceRate}% <span className="text-base text-muted-foreground">/ 100%</span>
                        </p>
                      </div>
                      <Badge variant="secondary">{compliantStaff} compliant</Badge>
                    </div>
                    <Progress value={complianceRate} className="mt-4" />
                    <p className="mt-3 text-sm text-muted-foreground">{totalStaff - compliantStaff} staff members still need more CPD hours.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget utilisation</p>
                        <p className="font-display text-3xl font-bold">
                          {budgetRate}% <span className="text-base text-muted-foreground">/ 100%</span>
                        </p>
                      </div>
                      <Badge variant="outline">RM {budgetUsed.toLocaleString()}</Badge>
                    </div>
                    <Progress value={budgetRate} className="mt-4" />
                    <p className="mt-3 text-sm text-muted-foreground">Remaining budget: RM {(allocatedBudget - budgetUsed).toLocaleString()}.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Submitted</p>
                    <p className="mt-2 text-lg font-semibold">{submittedClaims}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Approved</p>
                    <p className="mt-2 text-lg font-semibold">{approvedClaims}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Avg hours / staff</p>
                    <p className="mt-2 text-lg font-semibold">{Math.round(totalHours / totalStaff)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Watchlist for management</CardTitle>
                <CardDescription>Points worth highlighting to your boss.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {watchlist.map((item) => (
                  <div key={item} className="rounded-xl border p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Department performance</CardTitle>
                <CardDescription>Completion status by faculty or division.</CardDescription>
              </CardHeader>
              <CardContent>
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
                      {facultyPerformance.map((row) => (
                        <TableRow key={row.faculty}>
                          <TableCell className="font-medium">{row.faculty}</TableCell>
                          <TableCell className="hidden md:table-cell">{row.staff}</TableCell>
                          <TableCell>
                            <div className="min-w-[140px] space-y-2">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span>{row.completion}%</span>
                                <span className="text-muted-foreground">{row.staff} staff</span>
                              </div>
                              <Progress value={row.completion} />
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.avgHours}h</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={row.risk === "High" ? "destructive" : "outline"}
                              className={
                                row.risk === "Moderate"
                                  ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
                                  : row.risk === "Low"
                                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                    : undefined
                              }
                            >
                              {row.risk}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Monthly learning trend</CardTitle>
                <CardDescription>Total CPD hours recorded over the last 4 months.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {monthlyTrend.map((item) => (
                  <div key={item.month} className="space-y-2">
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
                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    April recorded the strongest learning activity this quarter.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top programmes by impact</CardTitle>
                <CardDescription>Useful highlights for a leadership update.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {topProgrammes.map((programme) => (
                  <div key={programme.title} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="font-medium leading-tight">{programme.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {programme.attendees} attendees • {programme.hours} CPD hours generated
                      </p>
                    </div>
                    <Badge variant={programme.impact === "High" ? "default" : "secondary"}>{programme.impact}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested talking points</CardTitle>
                <CardDescription>Short narrative for management presentation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-xl border p-4">
                  CPD participation is healthy overall, with strong momentum driven by compliance-related programmes and leadership workshops.
                </div>
                <div className="rounded-xl border p-4">
                  Requisition processing is stable, but evidence follow-up should be tightened to keep records audit-ready.
                </div>
                <div className="rounded-xl border p-4">
                  Lower-performing units should receive targeted reminders and priority scheduling next month to close the compliance gap.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
