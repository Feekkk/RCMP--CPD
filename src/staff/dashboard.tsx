import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, ChevronDown, Clock, FileText, Loader2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { NeedActionCard } from "@/components/cpd/NeedActionCard";
import { RequisitionPolicyCard } from "@/components/cpd/RequisitionPolicyCard";
import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchRequisitionHistory } from "@/lib/requisitionsApi";
import { formatHistoryDate, formatTodayDate, statusDetailLabel } from "@/lib/requisitionStatus";
import { StaffSidebar } from "@/staff/Sidebar";

export const StaffDashboardPage = () => {
  const { data: requisitionData, isLoading: isRecentLoading, isError: isRecentError } = useQuery({
    queryKey: ["requisitions", "history", "dashboard"],
    queryFn: () => fetchRequisitionHistory({ phase: "all", page: 1, pageSize: 5 }),
  });

  const totalRequisitions = requisitionData?.summary?.all ?? 0;
  const recentActivity = requisitionData?.requisitions ?? [];

  const stats = [
    { label: "Completed", value: "18h", icon: CheckCircle2, footnote: "Academic year 2025/2026" },
    { label: "Total Requisition", value: String(totalRequisitions), icon: FileText, footnote: "Submitted requisitions" },
    { label: "Remaining", value: "22h", icon: Clock, footnote: "Academic year 2025/2026" },
    { label: "This month", value: "+6h", icon: TrendingUp, footnote: "Academic year 2025/2026" },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <StaffSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{formatTodayDate()}</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:inline-flex">
                <CalendarCheck className="h-4 w-4" />
                Plan CPD
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4" />
                    New Requisition
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/staff/requisition">Make Requisition</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/staff/requisition/track">Track Requisition</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <p className="mt-1 text-xs text-muted-foreground">{s.footnote}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4">
              <NeedActionCard />

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle>Recent activity</CardTitle>
                    <CardDescription>Your latest CPD submissions and approvals.</CardDescription>
                  </div>
                  {recentActivity.length > 0 ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/staff/history">View all</Link>
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {isRecentLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : isRecentError ? (
                    <p className="py-4 text-center text-sm text-destructive">Unable to load recent activity.</p>
                  ) : recentActivity.length ? (
                    <div className="grid gap-3">
                      {recentActivity.map((item) => (
                        <div
                          key={item.requisitionId}
                          className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatHistoryDate(item.submittedAt)} · {item.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <RequisitionStatusBadge
                              statusGroup={item.statusGroup}
                              label={statusDetailLabel(item.status)}
                            />
                            {item.postTraining.cpdPoints != null ? (
                              <Badge variant="secondary">{item.postTraining.cpdPoints} pts</Badge>
                            ) : (
                              <p className="max-w-[140px] truncate text-right text-sm text-muted-foreground">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No requisitions yet.{" "}
                      <Link to="/staff/requisition" className="font-medium text-primary underline-offset-4 hover:underline">
                        Create your first requisition
                      </Link>
                    </p>
                  )}
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