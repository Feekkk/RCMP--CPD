import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FilePen, Loader2, Upload, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRequisitionHistory } from "@/lib/requisitionsApi";
import { cn } from "@/lib/utils";

const ACTION_ITEMS = [
  {
    key: "draft" as const,
    summaryKey: "draft" as const,
    label: "Draft requisitions",
    description: "Submit for HOD review when ready.",
    action: "Submit",
    href: "/staff/requisition",
    icon: FilePen,
    accent: "border-amber-500/40 bg-amber-500/5",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "rejected" as const,
    summaryKey: "rejected" as const,
    label: "Rejected requisitions",
    description: "Update based on feedback and resubmit.",
    action: "Resubmit",
    href: "/staff/requisition/track",
    icon: XCircle,
    accent: "border-red-500/40 bg-red-500/5",
    iconClass: "text-red-600 dark:text-red-400",
  },
  {
    key: "postTraining" as const,
    summaryKey: "postTraining" as const,
    label: "Post-training follow-up",
    description: "Upload attendance, complete e-survey, and HOD evaluation.",
    action: "Upload",
    href: "/staff/requisition/track",
    icon: Upload,
    accent: "border-primary/40 bg-primary/5",
    iconClass: "text-primary",
  },
];

export function NeedActionCard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "history", "need-action"],
    queryFn: () => fetchRequisitionHistory({ phase: "all", page: 1, pageSize: 1 }),
  });

  const summary = data?.summary;
  const actionCount = summary
    ? summary.draft + summary.rejected + summary.postTraining
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Need Action</CardTitle>
          <CardDescription>
            Requisitions that need you to submit, upload evidence, or resubmit to move forward.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/staff/requisition/track">See more</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load actions</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking your requisitions…
          </div>
        ) : actionCount === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="font-medium text-foreground">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">No requisitions need your attention right now.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {ACTION_ITEMS.map((item) => {
              const count = summary?.[item.summaryKey] ?? 0;
              if (count === 0) return null;

              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center",
                    item.accent,
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background", item.iconClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.label}{" "}
                        <span className="tabular-nums text-muted-foreground">({count})</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0 bg-background">
                    <Link to={item.href}>{item.action}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
