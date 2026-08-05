import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarCheck, CheckCircle2, ClipboardList, FileText, History, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { HodNeedActionCard } from "@/components/cpd/HodNeedActionCard";
import { InsightStatCard } from "@/components/cpd/InsightStatCard";
import { RequisitionPolicyCard } from "@/components/cpd/RequisitionPolicyCard";
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
  type HodDepartmentStaffMember,
  type HodProgrammeSlot,
  type RequisitionHistoryItem,
} from "@/lib/requisitionsApi";
import { statusDetailLabel, statusGroupTrafficLight, TRAFFIC_LIGHT_STYLES } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

const CPD_TARGET_HOURS = 40;

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

function roundHours(hours: number) {
  return Math.round(hours * 100) / 100;
}

function formatCpdHours(hours: number) {
  const rounded = roundHours(hours);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function hoursFromProgrammeSlots(slots: HodProgrammeSlot[]) {
  let totalMinutes = 0;
  for (const slot of slots) {
    if (!slot.from || !slot.to) continue;
    const fromParts = slot.from.split(":").map(Number);
    const toParts = slot.to.split(":").map(Number);
    if (fromParts.length < 2 || toParts.length < 2) continue;
    const [fromHour, fromMinute] = fromParts;
    const [toHour, toMinute] = toParts;
    if ([fromHour, fromMinute, toHour, toMinute].some((value) => Number.isNaN(value))) continue;
    const minutes = toHour * 60 + toMinute - (fromHour * 60 + fromMinute);
    if (minutes > 0) totalMinutes += minutes;
  }
  return roundHours(totalMinutes / 60);
}

function pendingHoursFromHistory(history: RequisitionHistoryItem[]) {
  return roundHours(
    history.reduce((sum, item) => {
      if (item.statusGroup === "draft" || item.statusGroup === "rejected") return sum;
      if (item.postTraining.cpdHoursCounted) return sum;
      const hours =
        item.postTraining.cpdHours != null
          ? Number(item.postTraining.cpdHours)
          : hoursFromProgrammeSlots(item.programmeSlots ?? []);
      return sum + (Number.isFinite(hours) ? hours : 0);
    }, 0),
  );
}

function showStaffHistoryToast(member: HodDepartmentStaffMember, history: RequisitionHistoryItem[]) {
  const items = history.filter((item) => item.staffEmail === member.email);

  toast.custom(
    (t) => (
      <div className="w-[min(100vw-2rem,360px)] rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{member.fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{member.email}</p>
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

        {items.length ? (
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {items.map((item) => {
              const light = TRAFFIC_LIGHT_STYLES[statusGroupTrafficLight(item.statusGroup)];
              return (
                <li key={item.requisitionId} className="flex items-center justify-between gap-3 text-sm">
                  <p className="min-w-0 truncate">{item.title || item.id}</p>
                  <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs font-medium", light.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", light.dot)} aria-hidden />
                    {statusDetailLabel(item.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No requisitions yet.</p>
        )}
      </div>
    ),
    { duration: items.length ? 10000 : 5000 },
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
  const isProgressLoading = isStaffLoading || isHistoryLoading;

  const departmentProgress = useMemo(() => {
    const completedHours = roundHours(
      staffList.reduce((sum, member) => sum + Number(member.cpdCompletedHours ?? 0), 0),
    );
    const pendingHours = pendingHoursFromHistory(departmentHistory);
    const targetHours = staffList.length
      ? staffList.reduce((sum, member) => sum + Number(member.cpdTargetHours ?? CPD_TARGET_HOURS), 0)
      : CPD_TARGET_HOURS;
    const remainingHours = roundHours(Math.max(0, targetHours - completedHours));
    const percent = targetHours ? Math.min(100, Math.round((completedHours / targetHours) * 100)) : 0;

    return {
      completedHours,
      pendingHours,
      targetHours,
      remainingHours,
      percent,
    };
  }, [staffList, departmentHistory]);

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
            {stats.map((s, index) => (
              <InsightStatCard
                key={s.label}
                title={s.label}
                value={s.isLoading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : s.value}
                description="Academic year 2025/2026"
                icon={s.icon}
                featured={index === 0}
              />
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
                        <TableHead className="text-right">CPD Hours</TableHead>
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
                              <span className="font-medium tabular-nums">
                                {formatCpdHours(member.cpdCompletedHours)}h
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                {" "}
                                / {formatCpdHours(member.cpdTargetHours)}h
                              </span>
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
                <CardDescription>
                  Department training hours towards the annual {CPD_TARGET_HOURS}h requirement per staff.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5">
                {isProgressLoading ? (
                  <div className="flex h-[210px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center">
                      <CircularProgress percent={departmentProgress.percent} />
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <p className="font-display text-3xl font-bold leading-none">{departmentProgress.percent}%</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCpdHours(departmentProgress.completedHours)}h /{" "}
                          {formatCpdHours(departmentProgress.targetHours)}h
                        </p>
                      </div>
                    </div>
                    <div className="grid w-full gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Approved</span>
                        <span className="font-medium">{formatCpdHours(departmentProgress.completedHours)}h</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-medium">{formatCpdHours(departmentProgress.pendingHours)}h</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">{formatCpdHours(departmentProgress.remainingHours)}h</span>
                      </div>
                    </div>
                  </>
                )}
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
