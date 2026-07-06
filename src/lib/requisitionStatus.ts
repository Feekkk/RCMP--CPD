export type HistoryStatusGroup = "draft" | "submitted" | "pending" | "approved" | "rejected";

export type WorkflowPhase = "draft" | "pre_training" | "post_training" | "completed" | "rejected";

export type HistoryPhaseFilter = "all" | WorkflowPhase;

export type TrafficLight = "red" | "yellow" | "green" | "neutral";

export const TRAFFIC_LIGHT_STYLES: Record<
  TrafficLight,
  {
    dot: string;
    border: string;
    bg: string;
    text: string;
    badge: string;
    cardAccent: string;
    summaryActive: string;
    summaryIdle: string;
    tabActive: string;
  }
> = {
  green: {
    dot: "bg-emerald-500",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    cardAccent: "border-l-emerald-500",
    summaryActive: "border-emerald-500 bg-emerald-500/10",
    summaryIdle: "border-border hover:border-emerald-500/40 hover:bg-emerald-500/5",
    tabActive: "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300",
  },
  yellow: {
    dot: "bg-amber-500",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-900 dark:text-amber-200",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200",
    cardAccent: "border-l-amber-500",
    summaryActive: "border-amber-500 bg-amber-500/10",
    summaryIdle: "border-border hover:border-amber-500/40 hover:bg-amber-500/5",
    tabActive: "data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-200",
  },
  red: {
    dot: "bg-red-500",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-800 dark:text-red-300",
    badge: "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300",
    cardAccent: "border-l-red-500",
    summaryActive: "border-red-500 bg-red-500/10",
    summaryIdle: "border-border hover:border-red-500/40 hover:bg-red-500/5",
    tabActive: "data-[state=active]:bg-red-500/15 data-[state=active]:text-red-800 dark:data-[state=active]:text-red-300",
  },
  neutral: {
    dot: "bg-muted-foreground/50",
    border: "border-border",
    bg: "bg-muted/40",
    text: "text-muted-foreground",
    badge: "border-muted-foreground/30 bg-muted text-muted-foreground",
    cardAccent: "border-l-muted-foreground/40",
    summaryActive: "border-muted-foreground/50 bg-muted/50",
    summaryIdle: "border-border hover:bg-muted/40",
    tabActive: "data-[state=active]:bg-muted data-[state=active]:text-foreground",
  },
};

export function workflowPhaseTrafficLight(phase: WorkflowPhase): TrafficLight {
  switch (phase) {
    case "completed":
      return "green";
    case "rejected":
      return "red";
    case "post_training":
    case "pre_training":
      return "yellow";
    default:
      return "neutral";
  }
}

export function statusGroupTrafficLight(group: HistoryStatusGroup): TrafficLight {
  switch (group) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "pending":
    case "submitted":
      return "yellow";
    default:
      return "neutral";
  }
}

export function phaseFilterTrafficLight(phase: HistoryPhaseFilter): TrafficLight {
  if (phase === "all") return "neutral";
  return workflowPhaseTrafficLight(phase);
}

const STATUS_GROUP_LABEL: Record<HistoryStatusGroup, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

const WORKFLOW_PHASE_LABEL: Record<WorkflowPhase, string> = {
  draft: "Draft",
  pre_training: "Pre-training",
  post_training: "Post-training",
  completed: "Completed",
  rejected: "Rejected",
};

const WORKFLOW_PHASE_DESCRIPTION: Record<WorkflowPhase, string> = {
  draft: "Saved but not yet submitted for approval.",
  pre_training: "Submitted and moving through approval, or approved and awaiting the programme date.",
  post_training: "Training has ended — complete attendance, e-survey, and HOD evaluation.",
  completed: "All requirements met and CPD points recorded.",
  rejected: "Requisition was not approved.",
};

export function statusGroupFromDb(status: string): HistoryStatusGroup {
  switch (status) {
    case "save_draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "being_process":
    case "verified":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
    case "rejected_hod":
    case "rejected_hr":
      return "rejected";
    default:
      return "submitted";
  }
}

export function statusDetailLabel(status: string): string {
  switch (status) {
    case "rejected_hod":
      return "Rejected by HOD";
    case "rejected_hr":
      return "Rejected by HR";
    case "rejected":
      return "Rejected by approval";
    default:
      return statusGroupLabel(statusGroupFromDb(status));
  }
}

export function statusGroupLabel(group: HistoryStatusGroup): string {
  return STATUS_GROUP_LABEL[group];
}

export function workflowPhaseLabel(phase: WorkflowPhase): string {
  return WORKFLOW_PHASE_LABEL[phase];
}

export function workflowPhaseDescription(phase: WorkflowPhase): string {
  return WORKFLOW_PHASE_DESCRIPTION[phase];
}

export function formatRequisitionId(id: number): string {
  return `REQ-${String(id).padStart(4, "0")}`;
}

export function formatHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
}

export function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
}

export function formatProgrammeDates(dates: string[]): string {
  if (!dates.length) return "No date set";
  if (dates.length === 1) return formatHistoryDate(dates[0]);
  const sorted = [...dates].sort();
  return `${formatHistoryDate(sorted[0])} – ${formatHistoryDate(sorted[sorted.length - 1])}`;
}

export function formatProgrammeSlotSchedule(slot: { date: string; from: string; to: string }): string {
  const date = formatHistoryDate(slot.date);
  if (!slot.from && !slot.to) return date;
  if (slot.from && slot.to) return `${date} · ${slot.from} – ${slot.to}`;
  return `${date} · ${slot.from || slot.to}`;
}

export function isTrainingPast(programmeDates: string[]): boolean {
  if (!programmeDates.length) return false;
  const last = programmeDates.reduce((a, b) => (a > b ? a : b));
  const today = new Date().toISOString().slice(0, 10);
  return last < today;
}

export type PreTrainingStep = {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "rejected";
};

export function preTrainingSteps(status: string): PreTrainingStep[] {
  const steps = [
    { key: "submitted", label: "Submitted" },
    { key: "hod", label: "HOD review" },
    { key: "hr", label: "HR verify" },
    { key: "dean", label: "Approval" },
  ] as const;

  if (status === "save_draft") {
    return steps.map((step) => ({ ...step, state: "upcoming" as const }));
  }

  const rejectedAtStep: Record<string, number> = {
    rejected_hod: 1,
    rejected_hr: 2,
    rejected: 3,
  };

  if (status in rejectedAtStep) {
    const rejectedIndex = rejectedAtStep[status];
    return steps.map((step, index) => ({
      ...step,
      state:
        index < rejectedIndex
          ? ("complete" as const)
          : index === rejectedIndex
            ? ("rejected" as const)
            : ("upcoming" as const),
    }));
  }

  const currentIndex: Record<string, number> = {
    submitted: 1,
    being_process: 2,
    verified: 3,
    approved: 4,
  };

  const progress = currentIndex[status] ?? 0;
  if (!progress) {
    return steps.map((step) => ({ ...step, state: "upcoming" as const }));
  }

  return steps.map((step, index) => ({
    ...step,
    state:
      progress === 4 || index < progress
        ? ("complete" as const)
        : index === progress
          ? ("current" as const)
          : ("upcoming" as const),
  }));
}
