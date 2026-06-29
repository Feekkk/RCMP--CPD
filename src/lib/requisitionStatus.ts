export type HistoryStatusFilter = "all" | "submitted" | "pending" | "approved" | "rejected";

export type HistoryStatusGroup = "draft" | "submitted" | "pending" | "approved" | "rejected";

const STATUS_GROUP_LABEL: Record<HistoryStatusGroup, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
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
      return "rejected";
    default:
      return "submitted";
  }
}

export function statusGroupLabel(group: HistoryStatusGroup): string {
  return STATUS_GROUP_LABEL[group];
}

export function formatRequisitionId(id: number): string {
  return `REQ-${String(id).padStart(4, "0")}`;
}

export function formatHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
}
