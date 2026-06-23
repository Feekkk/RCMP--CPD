import { AlertCircle, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { evaluateRequisitionDatePolicy } from "@/lib/requisitionPolicy";
import { cn } from "@/lib/utils";

export function ProgrammeDatePolicyAlert({ programmeDate }: { programmeDate: string }) {
  const policy = evaluateRequisitionDatePolicy(programmeDate);
  if (!policy) return null;

  const Icon = policy.isUrgent ? AlertCircle : Info;

  return (
    <Alert
      className={cn(
        policy.isUrgent
          ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-300"
          : "border-primary/30 bg-primary/5 [&>svg]:text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-sm">
        {policy.isUrgent ? "Urgent requisition" : "Policy check"}
      </AlertTitle>
      <AlertDescription className="text-sm opacity-90">{policy.message}</AlertDescription>
    </Alert>
  );
}
