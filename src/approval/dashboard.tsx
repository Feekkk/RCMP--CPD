import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Eye, FileText, Loader2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ApprovalDialog } from "@/approval/Approval";
import { ApprovalSidebar } from "@/approval/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchApprovalDashboardItems,
  fetchApprovalDashboardStats,
  submitApproval,
  type ApprovalDashboardView,
  type ApprovalQueueItem,
} from "@/lib/requisitionsApi";
import { formatHistoryDate, formatTodayDate } from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

const currentMonthLabel = new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" });

const VIEW_CONFIG: Record<
  ApprovalDashboardView,
  {
    label: string;
    hint: string;
    panelTitle: string;
    panelDescription: string;
    emptyTitle: string;
    emptyDescription: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending approval",
    hint: "Requisitions awaiting your final decision",
    panelTitle: "Pending Final Approval",
    panelDescription: "Requisitions verified by HR and awaiting your approval.",
    emptyTitle: "No pending approvals",
    emptyDescription: "All HR-verified requisitions have been reviewed.",
    icon: Clock,
  },
  approved: {
    label: "Approved (month)",
    hint: `Management approvals in ${currentMonthLabel}`,
    panelTitle: "Approved This Month",
    panelDescription: "Requisitions you approved during the current month.",
    emptyTitle: "No approvals this month",
    emptyDescription: "Approved requisitions will appear here once decisions are recorded.",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected (month)",
    hint: `Management rejections in ${currentMonthLabel}`,
    panelTitle: "Rejected This Month",
    panelDescription: "Requisitions you rejected during the current month.",
    emptyTitle: "No rejections this month",
    emptyDescription: "Rejected requisitions will appear here once decisions are recorded.",
    icon: TrendingUp,
  },
  verified: {
    label: "Verified queue",
    hint: `Forwarded by HR verification in ${currentMonthLabel}`,
    panelTitle: "HR Verified This Month",
    panelDescription: "Requisitions forwarded by HR verification during the current month.",
    emptyTitle: "No HR-verified requisitions this month",
    emptyDescription: "Items will appear here once HR verifies and forwards them for approval.",
    icon: FileText,
  },
};

function statusBadge(status: string) {
  if (status === "approved") {
    return <Badge variant="default">Approved</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return (
    <Badge
      variant="outline"
      className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
    >
      Awaiting approval
    </Badge>
  );
}

export function ApprovalDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<ApprovalDashboardView>("pending");
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<number | null>(null);
  const [confirmRejectItem, setConfirmRejectItem] = useState<ApprovalQueueItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const activeView = VIEW_CONFIG[selectedView];

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["requisitions", "approval", "dashboard-stats"],
    queryFn: fetchApprovalDashboardStats,
  });

  const { data: itemsData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["requisitions", "approval", "dashboard-items", selectedView],
    queryFn: () => fetchApprovalDashboardItems(selectedView),
  });

  const approvalMutation = useMutation({
    mutationFn: ({
      requisitionId,
      decision,
      remarks,
    }: {
      requisitionId: number;
      decision: "approve" | "reject";
      remarks?: string;
    }) => submitApproval(requisitionId, decision, remarks),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["requisitions", "approval"] });
      setSelectedRequisitionId(null);
      setConfirmRejectItem(null);
      setRejectRemarks("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to submit approval decision.");
    },
  });

  const statValues: Record<ApprovalDashboardView, number> = {
    pending: dashboardStats?.pendingApproval ?? 0,
    approved: dashboardStats?.approvedThisMonth ?? 0,
    rejected: dashboardStats?.rejectedThisMonth ?? 0,
    verified: dashboardStats?.verifiedThisMonth ?? 0,
  };

  const items = itemsData?.requisitions ?? [];

  const handleApprove = (item: ApprovalQueueItem) => {
    approvalMutation.mutate({ requisitionId: item.requisitionId, decision: "approve" });
  };

  const handleRejectConfirm = () => {
    if (!confirmRejectItem) return;
    const remarks = rejectRemarks.trim();
    if (!remarks) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    approvalMutation.mutate({
      requisitionId: confirmRejectItem.requisitionId,
      decision: "reject",
      remarks,
    });
  };

  const closeRejectDialog = () => {
    setConfirmRejectItem(null);
    setRejectRemarks("");
  };

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <ApprovalSidebar />

      <div className="flex min-w-0 flex-1 flex-col pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{formatTodayDate()}</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">My Dashboard</h1>
            </div>
            <Button asChild>
              <Link to="/approval/approval">
                <FileText className="h-4 w-4" />
                Review queue
              </Link>
            </Button>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(VIEW_CONFIG) as ApprovalDashboardView[]).map((view) => {
              const config = VIEW_CONFIG[view];
              const isActive = selectedView === view;

              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => setSelectedView(view)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "h-full transition-colors hover:bg-accent/40",
                      isActive && "border-primary ring-1 ring-primary/30",
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <config.icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-2xl font-bold">
                        {isStatsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                          statValues[view]
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{config.hint}</p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{activeView.panelTitle}</CardTitle>
              <CardDescription>{activeView.panelDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {isItemsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center">
                  <p className="font-medium text-foreground">{activeView.emptyTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeView.emptyDescription}</p>
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
                        <TableHead className="hidden sm:table-cell whitespace-nowrap">Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[72px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((row) => (
                        <TableRow key={row.requisitionId}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium leading-none">{row.title}</p>
                              <p className="text-sm text-muted-foreground md:hidden">{row.staffName}</p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                Submitted: {formatHistoryDate(row.submittedAt)}
                              </p>
                              <p className="text-sm text-muted-foreground sm:hidden">
                                Total: RM {Number(row.totalBudget ?? 0).toFixed(2)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.staffName}</TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {formatHistoryDate(row.submittedAt)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap tabular-nums">
                            RM {Number(row.totalBudget ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>{statusBadge(row.status)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`View ${row.id} details`}
                              onClick={() => setSelectedRequisitionId(row.requisitionId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        <ApprovalDialog
          requisitionId={selectedRequisitionId}
          open={selectedRequisitionId != null}
          onOpenChange={(open) => {
            if (!open) setSelectedRequisitionId(null);
          }}
          onApprove={handleApprove}
          onReject={(item) => setConfirmRejectItem(item)}
          isSubmitting={approvalMutation.isPending}
        />

        <AlertDialog
          open={confirmRejectItem != null}
          onOpenChange={(open) => {
            if (!open) closeRejectDialog();
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject requisition?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmRejectItem
                  ? `This will permanently reject ${confirmRejectItem.id} (${confirmRejectItem.title}). The staff member cannot edit or resubmit this requisition.`
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="dashboardRejectRemarks">Rejection remarks</Label>
              <Textarea
                id="dashboardRejectRemarks"
                placeholder="Explain why this requisition is being rejected…"
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={approvalMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{rejectRemarks.length}/500 characters</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approvalMutation.isPending} onClick={closeRejectDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={approvalMutation.isPending || !rejectRemarks.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  handleRejectConfirm();
                }}
              >
                {approvalMutation.isPending ? "Rejecting…" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <footer className="mt-auto w-full border-t">
          <div className="container mx-auto py-4">
            <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Human Capital Department UNIKL Royal College Of Medicine Perak</p>
            <p className="text-center text-xs text-muted-foreground">All rights reserved.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
