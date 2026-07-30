import { CheckCircle2, Clock, FileText, History, Loader2, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AdminNeedActionCard } from "@/components/cpd/AdminNeedActionCard";
import { InsightStatCard } from "@/components/cpd/InsightStatCard";
import { RequisitionPolicyCard } from "@/components/cpd/RequisitionPolicyCard";
import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/admin/Sidebar";
import { fetchAdminDashboardStats, fetchAdminRecentSubmissions } from "@/lib/requisitionsApi";
import { formatHistoryDate, formatTodayDate, statusDetailLabel } from "@/lib/requisitionStatus";

export const AdminDashboardPage = () => {
  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["requisitions", "admin", "dashboard-stats"],
    queryFn: fetchAdminDashboardStats,
  });

  const {
    data: recentData,
    isLoading: isRecentLoading,
    isError: isRecentError,
  } = useQuery({
    queryKey: ["requisitions", "admin", "recent-submissions"],
    queryFn: () => fetchAdminRecentSubmissions(5),
  });

  const recentSubmissions = recentData?.requisitions ?? [];

  const stats = [
    {
      label: "Pending verification",
      value: dashboardStats?.pendingVerification ?? 0,
      icon: Clock,
    },
    {
      label: "Approved this month",
      value: dashboardStats?.verifiedThisMonth ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Rejected this month",
      value: dashboardStats?.rejectedThisMonth ?? 0,
      icon: TrendingUp,
    },
    {
      label: "Total staff",
      value: dashboardStats?.totalStaff ?? 0,
      icon: Users,
    },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{formatTodayDate()}</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">My Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Requisitions" className="h-10 w-10 p-0 sm:w-auto sm:px-4">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Requisition</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/admin/requisitions" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Make Requisitions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/history" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Activity Log
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, index) => (
              <InsightStatCard
                key={s.label}
                title={s.label}
                value={isStatsLoading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : s.value}
                description="Academic year 2025/2026"
                icon={s.icon}
                featured={index === 0}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4">
              <AdminNeedActionCard />

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Recent submissions</CardTitle>
                    <CardDescription>Latest requisitions submitted by staff.</CardDescription>
                  </div>
                  {recentSubmissions.length > 0 ? (
                    <Button variant="outline" size="sm" className="shrink-0" asChild>
                      <Link to="/admin/history">View all</Link>
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {isRecentLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : isRecentError ? (
                    <p className="py-4 text-center text-sm text-destructive">Unable to load recent submissions.</p>
                  ) : recentSubmissions.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-12 text-center">
                      <p className="font-medium text-foreground">No submissions yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Staff requisitions will appear here once submitted.</p>
                    </div>
                  ) : (
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
                          {recentSubmissions.map((row) => (
                            <TableRow key={row.requisitionId}>
                              <TableCell className="font-medium">{row.id}</TableCell>
                              <TableCell>
                                <div className="grid gap-1">
                                  <p className="font-medium leading-none">{row.title}</p>
                                  <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                                  <p className="text-sm text-muted-foreground md:hidden">
                                    Submitted: {formatHistoryDate(row.submittedAt)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                              <TableCell className="hidden md:table-cell">{formatHistoryDate(row.submittedAt)}</TableCell>
                              <TableCell className="text-right">
                                <RequisitionStatusBadge
                                  statusGroup={row.statusGroup}
                                  label={statusDetailLabel(row.status)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

