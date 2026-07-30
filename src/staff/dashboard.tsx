import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const CURRENT_YEAR_LABEL = `Year ${new Date().getFullYear()}`;
const COMPLETED_HOURS_MOCK = 18;

type TrackStatus = "off-track" | "need-attention" | "on-track";

const TRACK_STATUS_MOCK: TrackStatus = "need-attention";

const trackStatusMeta: Record<
  TrackStatus,
  { label: string; valueClass: string; iconClass: string }
> = {
  "on-track": {
    label: "On-track",
    valueClass: "text-green-600 dark:text-green-400",
    iconClass: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  "need-attention": {
    label: "Need Attention",
    valueClass: "text-yellow-600 dark:text-yellow-400",
    iconClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  "off-track": {
    label: "Off-Track",
    valueClass: "text-red-600 dark:text-red-400",
    iconClass: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

export const StaffDashboardPage = () => {
  const { data: requisitionData, isLoading: isRecentLoading, isError: isRecentError } = useQuery({
    queryKey: ["requisitions", "history", "dashboard"],
    queryFn: () => fetchRequisitionHistory({ phase: "all", page: 1, pageSize: 5 }),
  });

  const submittedRequisitions = requisitionData?.summary
    ? requisitionData.summary.all - requisitionData.summary.draft
    : 0;
  const recentActivity = requisitionData?.requisitions ?? [];
  const trackStatus = trackStatusMeta[TRACK_STATUS_MOCK];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <StaffSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{formatTodayDate()}</p>
              <h1 className="h-[38px] font-[Georgia,serif] text-2xl font-bold tracking-tight">My Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" aria-label="Plan CPD" className="h-10 w-10 p-0 sm:w-auto sm:px-4" asChild>
                <Link to="/staff/calendar">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="New Requisition" className="h-10 w-10 p-0 sm:w-auto sm:px-4">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Requisition</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/staff/requisition">New Requisition</Link>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold">{COMPLETED_HOURS_MOCK}h</p>
                <p className="mt-1 text-xs text-muted-foreground">{CURRENT_YEAR_LABEL}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Requisition</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold">
                  {isRecentLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    submittedRequisitions
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Submitted requisitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Your Status</CardTitle>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", trackStatus.iconClass)}>
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className={cn("font-display text-2xl font-bold", trackStatus.valueClass)}>{trackStatus.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">Complete you training to stay on track</p>
              </CardContent>
            </Card>
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
              <RequisitionPolicyCard />
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t md:pl-72">
        <div className="container mx-auto py-4">
          <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Human Capital Department UNIKL Royal College Of Medicine Perak</p>
          <p className="text-center text-xs text-muted-foreground">All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
};