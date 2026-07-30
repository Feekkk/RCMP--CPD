import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FilePen,
  Loader2,
  XCircle,
} from "lucide-react";

import { InsightStatCard } from "@/components/cpd/InsightStatCard";
import { RequisitionHistoryCard } from "@/components/cpd/RequisitionHistoryCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRequisitionHistory } from "@/lib/requisitionsApi";
import {
  type HistoryPhaseFilter,
  phaseFilterTrafficLight,
  TRAFFIC_LIGHT_STYLES,
  workflowPhaseDescription,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

const PHASE_ICON_BADGE: Record<keyof typeof TRAFFIC_LIGHT_STYLES, string> = {
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  yellow: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  neutral: "bg-secondary text-secondary-foreground",
};
const PHASE_TABS: {
  value: Exclude<HistoryPhaseFilter, "all">;
  label: string;
  hint?: string;
  summaryKey: keyof import("@/lib/requisitionsApi").RequisitionHistorySummary;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
    { value: "draft", label: "Drafts", hint: "Saved but not submitted yet", summaryKey: "draft", icon: FilePen },
    {
      value: "pre_training",
      label: "Pre-training",
      hint: "In approval or waiting for training day",
      summaryKey: "preTraining",
      icon: Clock,
    },
    {
      value: "post_training",
      label: "Post-training",
      hint: "Training done - evidence & survey needed",
      summaryKey: "postTraining",
      icon: ClipboardCheck,
    },
    {
      value: "completed",
      label: "Completed",
      hint: "All steps done, CPD hours counted",
      summaryKey: "completed",
      icon: Award,
    },
    {
      value: "rejected",
      label: "Rejected",
      hint: "Not approved - check remarks",
      summaryKey: "rejected",
      icon: XCircle,
    },
  ];

const LEGEND = [
  { light: "green" as const, label: "Complete / approved" },
  { light: "yellow" as const, label: "In progress / action needed" },
  { light: "red" as const, label: "Rejected / blocked" },
];

type RequisitionHistoryPanelProps = {
  description: string;
  showBudget?: boolean;
  editPath?: string;
  pageSize?: number;
  neutralStyle?: boolean;
};

export function RequisitionHistoryPanel({
  description,
  showBudget = false,
  editPath = "/staff/requisition",
  pageSize = 10,
  neutralStyle = false,
}: RequisitionHistoryPanelProps) {
  const [phaseFilter, setPhaseFilter] = React.useState<HistoryPhaseFilter>("all");
  const [page, setPage] = React.useState(1);
  const paginated = pageSize < 100;

  React.useEffect(() => {
    setPage(1);
  }, [phaseFilter]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["requisitions", "history", phaseFilter, page, pageSize],
    queryFn: () =>
      fetchRequisitionHistory({
        phase: phaseFilter,
        page,
        pageSize,
      }),
  });

  const rows = data?.requisitions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const safePage = data?.page ?? 1;
  const summary = data?.summary;

  const activePhaseHint =
    phaseFilter !== "all" ? workflowPhaseDescription(phaseFilter as Exclude<HistoryPhaseFilter, "all">) : null;

  const activeHintLight = phaseFilter !== "all" ? phaseFilterTrafficLight(phaseFilter) : "neutral";
  const activeHintStyles = neutralStyle ? TRAFFIC_LIGHT_STYLES.neutral : TRAFFIC_LIGHT_STYLES[activeHintLight];

  const stylesFor = (light: keyof typeof TRAFFIC_LIGHT_STYLES) =>
    neutralStyle ? TRAFFIC_LIGHT_STYLES.neutral : TRAFFIC_LIGHT_STYLES[light];

  return (
    <div className="mt-6 grid gap-6">
      {!neutralStyle ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status key</p>
          {LEGEND.map(({ light, label }) => (
            <span key={light} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", TRAFFIC_LIGHT_STYLES[light].dot)} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PHASE_TABS.map((tab) => {
            const count = summary[tab.summaryKey] ?? 0;
            const active = phaseFilter === tab.value;
            const light = phaseFilterTrafficLight(tab.value);
            const styles = stylesFor(light);

            return (
              <InsightStatCard
                key={tab.value}
                title={tab.label}
                value={count}
                description={tab.hint}
                icon={tab.icon}
                onClick={() => setPhaseFilter(active ? "all" : tab.value)}
                className={cn(active ? styles.summaryActive : styles.summaryIdle)}
                iconClassName={neutralStyle ? undefined : PHASE_ICON_BADGE[light]}
              />
            );
          })}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Requisition history</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {activePhaseHint ? (
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                neutralStyle
                  ? "border-border bg-muted/30 text-muted-foreground"
                  : cn(activeHintStyles.border, activeHintStyles.bg, activeHintStyles.text),
              )}
            >
              {!neutralStyle ? (
                <span className={cn("mr-2 inline-block h-2 w-2 rounded-full align-middle", activeHintStyles.dot)} />
              ) : null}
              {activePhaseHint}
            </p>
          ) : null}

          {isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load history</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading requisitions…
            </div>
          ) : rows.length ? (
            <div className="grid gap-4">
              {rows.map((row) => (
                <RequisitionHistoryCard
                  key={row.requisitionId}
                  item={row}
                  showBudget={showBudget}
                  editPath={editPath}
                  neutralStyle={neutralStyle}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
              No requisitions found for this phase.
            </div>
          )}

          {paginated && !isLoading ? (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{rows.length}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span>
                {isFetching ? <span className="ml-2 text-xs">Updating…</span> : null}
              </p>
              {total > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={safePage <= 1 || isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={safePage >= totalPages || isFetching}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
