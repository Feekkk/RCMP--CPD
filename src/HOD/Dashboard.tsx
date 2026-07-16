import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarCheck, CheckCircle2, ClipboardList, FileText, History, Loader2, User, Users, X } from "lucide-react";
import { toast } from "sonner";

import { HodNeedActionCard } from "@/components/cpd/HodNeedActionCard";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HODSidebar } from "@/HOD/Sidebar";
import { fetchCurrentUser } from "@/lib/authApi";
import { AUTH_ME_QUERY_KEY } from "@/hooks/useAuth";
import {
  fetchHodDepartmentStaff,
  fetchHodRequisitionHistory,
  fetchHodReviewQueue,
  type CpdTrackStatus,
  type HodDepartmentStaffMember,
  type RequisitionHistoryItem,
} from "@/lib/requisitionsApi";
import { statusDetailLabel } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

const trackStatusMeta: Record<
  CpdTrackStatus,
  { label: string; badgeClass: string }
> = {
  "on-track": {
    label: "On-track",
    badgeClass: "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-300",
  },
  "need-attention": {
    label: "Need Attention",
    badgeClass: "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  },
  "off-track": {
    label: "Off-Track",
    badgeClass: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  },
};

async function fetchAllDepartmentHistory(): Promise<RequisitionHistoryItem[]> {
  const firstPage = await fetchHodRequisitionHistory({ phase: "all", page: 1, pageSize: 100 });
  const items = [...firstPage.requisitions];
  if (firstPage.totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        fetchHodRequisitionHistory({ phase: "all", page: index + 2, pageSize: 100 }),
      ),
    );
    for (const page of pages) items.push(...page.requisitions);
  }
  return items;
}

function isCurrentMonth(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function countApprovedThisMonth(history: RequisitionHistoryItem[]) {
  return history.filter(
    (item) =>
      isCurrentMonth(item.updatedAt) &&
      (item.status === "approved" || item.workflowPhase === "post_training" || item.workflowPhase === "completed"),
  ).length;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function showStaffHistoryToast(member: HodDepartmentStaffMember, history: RequisitionHistoryItem[]) {
  const items = history.filter((item) => item.staffEmail === member.email);

  if (!items.length) {
    toast.custom(
      (t) => (
        <div className="flex w-[min(100vw-2rem,360px)] items-start gap-3 rounded-xl border bg-background p-4 shadow-lg">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{member.fullName}</p>
            <p className="mt-1 text-sm text-muted-foreground">No requisitions submitted yet.</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => toast.dismiss(t)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: 6000 },
    );
    return;
  }

  toast.custom(
    (t) => (
      <div className="w-[min(100vw-2rem,400px)] overflow-hidden rounded-xl border bg-background shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initialsFromName(member.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{member.fullName}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => toast.dismiss(t)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requisition history</p>
          <Badge variant="secondary" className="tabular-nums">
            {items.length}
          </Badge>
        </div>

        <ul className="max-h-56 space-y-0 overflow-y-auto p-2">
          {items.map((item) => (
            <li
              key={item.requisitionId}
              className="rounded-lg border border-transparent px-2.5 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {item.id}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium leading-snug">
                    {item.title || "Untitled programme"}
                  </p>
                </div>
                <RequisitionStatusBadge
                  statusGroup={item.statusGroup}
                  label={statusDetailLabel(item.status)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
    { duration: 15000 },
  );
}

function CircularProgress({ percent, size = 128, stroke = 10 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted/40" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export const HODDashboardPage = () => {
  const { data: currentUser } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
  });

  const {
    data: departmentStaff,
    isLoading: isStaffLoading,
    isError: isStaffError,
  } = useQuery({
    queryKey: ["requisitions", "hod", "department-staff"],
    queryFn: fetchHodDepartmentStaff,
  });

  const { data: departmentHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["requisitions", "hod", "history", "dashboard"],
    queryFn: fetchAllDepartmentHistory,
  });

  const { data: reviewQueueData, isLoading: isReviewQueueLoading } = useQuery({
    queryKey: ["requisitions", "hod", "review-queue", "dashboard"],
    queryFn: fetchHodReviewQueue,
  });

  const staffList = departmentStaff?.staff ?? [];
  const reviewQueueCount = reviewQueueData?.summary.pending ?? 0;
  const approvedThisMonth = useMemo(() => countApprovedThisMonth(departmentHistory), [departmentHistory]);
  const teamMembers = staffList.length;

  const stats = [
    {
      label: "Review queue",
      value: reviewQueueCount,
      icon: ClipboardList,
      isLoading: isReviewQueueLoading,
    },
    {
      label: "Approved (month)",
      value: approvedThisMonth,
      icon: CheckCircle2,
      isLoading: isHistoryLoading,
    },
    {
      label: "Total staff",
      value: teamMembers,
      icon: Users,
      isLoading: isStaffLoading,
    },
  ] as const;

  const myCpdCompleted = 14;
  const myCpdTarget = 40;
  const myCpdPercent = myCpdTarget ? Math.round((myCpdCompleted / myCpdTarget) * 100) : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {currentUser?.departmentName ?? "Head of Department"}
              </p>
              <h1 className="font-[Georgia,serif] text-2xl font-bold tracking-tight">My Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                aria-label="Department calendar"
                className="h-10 w-10 p-0 sm:w-auto sm:px-4"
                asChild
              >
                <Link to="/hod/calendar">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Requisitions" className="h-10 w-10 p-0 sm:w-auto sm:px-4">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Requisition</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/hod/requisitions" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Make Requisitions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/hod/requisition/track" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      My Requisition
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-bold">
                    {s.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : s.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Academic year 2025/2026</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4">
              <HodNeedActionCard />

              <Card>
              <CardHeader>
                <div>
                  <CardTitle>My Department</CardTitle>
                  <CardDescription>
                    {departmentStaff?.departmentName
                      ? `List of staff members in ${departmentStaff.departmentName}.`
                      : "List of staff members in your department."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isStaffLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : isStaffError ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-12 text-center text-sm text-destructive">
                            Unable to load department staff.
                          </TableCell>
                        </TableRow>
                      ) : staffList.length ? (
                        staffList.map((member) => (
                          <TableRow
                            key={member.staffId}
                            className="cursor-pointer"
                            onClick={() => showStaffHistoryToast(member, departmentHistory)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                showStaffHistoryToast(member, departmentHistory);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`View requisition history for ${member.fullName}`}
                          >
                            <TableCell>
                              <div className="grid gap-1">
                                <p className="font-medium leading-none">{member.fullName}</p>
                                <p className="text-sm text-muted-foreground md:hidden">{member.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{member.email}</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn(trackStatusMeta[member.trackStatus].badgeClass)}
                              >
                                {trackStatusMeta[member.trackStatus].label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                            No staff found in your department.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Department Progress
                </CardTitle>
                <CardDescription>Training hours towards the annual requirement.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <CircularProgress percent={myCpdPercent} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="font-display text-3xl font-bold leading-none">{myCpdPercent}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {myCpdCompleted}h / {myCpdTarget}h
                    </p>
                  </div>
                </div>
                <div className="grid w-full gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="font-medium">10h</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">4h</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium">{myCpdTarget - myCpdCompleted}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
