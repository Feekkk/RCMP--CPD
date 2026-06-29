import { Badge } from "@/components/ui/badge";
import { type HistoryStatusGroup, statusGroupLabel } from "@/lib/requisitionStatus";

export function RequisitionStatusBadge({ statusGroup }: { statusGroup: HistoryStatusGroup }) {
  const variant =
    statusGroup === "approved"
      ? "default"
      : statusGroup === "rejected"
        ? "destructive"
        : statusGroup === "pending"
          ? "outline"
          : statusGroup === "draft"
            ? "secondary"
            : "outline";

  const className =
    statusGroup === "pending"
      ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-300"
      : undefined;

  return (
    <Badge variant={variant} className={className}>
      {statusGroupLabel(statusGroup)}
    </Badge>
  );
}
