import { Award, CalendarCheck, CheckCircle2, Clock, FileText, TrendingUp } from "lucide-react";

import { CpdProgressOverviewCard, STAFF_PROGRESS_MOCK } from "@/components/cpd/CpdProgressOverviewCard";
import { RequisitionPolicyCard } from "@/components/cpd/RequisitionPolicyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffSidebar } from "@/staff/Sidebar";

export const StaffDashboardPage = () => {
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
            <div className="lg:col-span-2 grid gap-4">
              <CpdProgressOverviewCard
                description="Stay on track toward the 40-hour annual requirement."
                data={STAFF_PROGRESS_MOCK}
              />

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

            <div className="grid gap-4">
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

              <RequisitionPolicyCard />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};