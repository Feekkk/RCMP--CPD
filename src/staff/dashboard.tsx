import { Award, CalendarCheck, CheckCircle2, Clock, FileText, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StaffSidebar } from "@/staff/Sidebar";

export const StaffDashboardPage = () => {
  const completed = 18;
  const target = 40;
  const percent = Math.round((completed / target) * 100);

  const stats = [
    { label: "CPD target", value: "40h", icon: Award },
    { label: "Completed", value: "18h", icon: CheckCircle2 },
    { label: "Remaining", value: "22h", icon: Clock },
    { label: "This month", value: "+6h", icon: TrendingUp },
  ] as const;

  const recent = [
    { title: "Workshop: Active Learning Strategies", hours: 3, status: "Approved", date: "Apr 21, 2026" },
    { title: "Conference: Teaching & Learning Symposium", hours: 6, status: "Pending", date: "Apr 11, 2026" },
    { title: "Webinar: Research Supervision Updates", hours: 2, status: "Approved", date: "Mar 27, 2026" },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <StaffSidebar />

      <div className="min-w-0 md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:inline-flex">
                <CalendarCheck className="h-4 w-4" />
                Plan CPD
              </Button>
              <Button>
                <FileText className="h-4 w-4" />
                New Requisition
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
                <CardTitle>Progress overview</CardTitle>
                <CardDescription>Stay on track toward the 40-hour annual requirement.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-display text-3xl font-bold">
                      {completed}h <span className="text-muted-foreground">/ {target}h</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="h-6">
                    {percent}%
                  </Badge>
                </div>
                <Progress value={percent} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Approved</p>
                    <p className="mt-2 text-lg font-semibold">12h</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</p>
                    <p className="mt-2 text-lg font-semibold">6h</p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rejected</p>
                    <p className="mt-2 text-lg font-semibold">0h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common tasks for day-to-day updates.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4" />
                  Create requisition
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="h-4 w-4" />
                  Upload evidence
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4" />
                  View history
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Your latest CPD submissions and approvals.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {recent.map((r) => (
                    <div
                      key={r.title}
                      className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{r.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={r.status === "Approved" ? "default" : "secondary"}>{r.status}</Badge>
                        <p className="w-16 text-right font-semibold">{r.hours}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};