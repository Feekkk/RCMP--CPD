import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminVerifyQueue } from "@/lib/requisitionsApi";
import { cn } from "@/lib/utils";

export function AdminNeedActionCard({ className }: { className?: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "admin", "verify-queue", "need-action"],
    queryFn: fetchAdminVerifyQueue,
  });

  const awaitingVerification = data?.summary.total ?? 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Need Action</CardTitle>
          <CardDescription>
            Requisitions recommended by HOD that need your verification before dean approval.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/admin/verify-requisition">See more</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid flex-1 content-start gap-4">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load actions</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking verification queue…
          </div>
        ) : awaitingVerification === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <div>
              <p className="font-medium text-foreground">You&apos;re all caught up</p>
              <p className="mt-1 text-sm text-muted-foreground">No requisitions need verification right now.</p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 sm:flex-row sm:items-center",
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-amber-600 dark:text-amber-400">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">
                  Awaiting verification{" "}
                  <span className="tabular-nums text-muted-foreground">({awaitingVerification})</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review HOD-recommended requisitions and verify before dean approval.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 bg-background">
              <Link to="/admin/verify-requisition">Verify</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
