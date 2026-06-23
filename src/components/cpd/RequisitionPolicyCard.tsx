import { AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUISITION_LEAD_TIME_MONTHS, REQUISITION_POLICY_RULES } from "@/lib/requisitionPolicy";

export function RequisitionPolicyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Policy &amp; rules
        </CardTitle>
        <CardDescription>Requisition submission guidelines for CPD programmes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">Submission window</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your requisition at least{" "}
            <span className="font-semibold text-foreground">{REQUISITION_LEAD_TIME_MONTHS} months</span> before the
            programme date.
          </p>
        </div>

        <ul className="grid gap-3">
          {REQUISITION_POLICY_RULES.map((rule) => (
            <li key={rule.title} className="flex gap-3 rounded-lg border bg-card p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{rule.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Urgent approval path</p>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
              Late submissions (within {REQUISITION_LEAD_TIME_MONTHS} months of the programme) are automatically
              flagged as urgent and routed to the Dean or HR for approval.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
