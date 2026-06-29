import { Badge } from "@/components/ui/badge";
import {
  type HistoryStatusGroup,
  statusGroupLabel,
  statusGroupTrafficLight,
  TRAFFIC_LIGHT_STYLES,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";

export function RequisitionStatusBadge({ statusGroup }: { statusGroup: HistoryStatusGroup }) {
  const light = statusGroupTrafficLight(statusGroup);
  const styles = TRAFFIC_LIGHT_STYLES[light];

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", styles.badge)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} aria-hidden />
      {statusGroupLabel(statusGroup)}
    </Badge>
  );
}
