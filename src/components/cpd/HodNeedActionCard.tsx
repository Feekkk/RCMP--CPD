import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardList, Loader2, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHodPostTrainingQueue, fetchHodReviewQueue } from "@/lib/requisitionsApi";
import { cn } from "@/lib/utils";

const ACTION_ITEMS = [
  {
    key: "pendingReview" as const,
    label: "Awaiting your review",
    description: "Staff requisitions submitted for department endorsement.",
    action: "Review",
    href: "/hod/review-queue",
    icon: ClipboardList,
    accent: "border-amber-500/40 bg-amber-500/5",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "postTrainingEval" as const,
    label: "Post-training evaluation",
    description: "Complete HOD evaluation for staff programmes.",
    action: "Evaluate",
    href: "/hod/review-queue?tab=post_training",
    icon: Users,
    accent: "border-primary/40 bg-primary/5",
    iconClass: "text-primary",
  },
] as const;

export function HodNeedActionCard() {
  const queueQuery = useQuery({
    queryKey: ["requisitions", "hod", "review-queue", "need-action"],
    queryFn: fetchHodReviewQueue,
  });

  const postTrainingQuery = useQuery({
    queryKey: ["requisitions", "hod", "post-training", "queue"],
    queryFn: fetchHodPostTrainingQueue,
  });

  const pendingReview = queueQuery.data?.summary.pending ?? 0;
  const postTrainingEval = postTrainingQuery.data?.summary.due ?? 0;

  const counts: Record<(typeof ACTION_ITEMS)[number]["key"], number> = {
    pendingReview,
    postTrainingEval,
  };

  const actionCount = pendingReview + postTrainingEval;
  const isLoading = queueQuery.isLoading || postTrainingQuery.isLoading;
  const isError = queueQuery.isError || postTrainingQuery.isError;
  const error = queueQuery.error ?? postTrainingQuery.error;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Need Action</CardTitle>
          <CardDescription>
            Department requisitions that need your review or post-training evaluation.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/hod/review-queue">See more</Link>
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
            Checking department requisitions…
          </div>
        ) : actionCount === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="font-medium text-foreground">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">No department requisitions need your attention right now.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {ACTION_ITEMS.map((item) => {
              const count = counts[item.key];
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
