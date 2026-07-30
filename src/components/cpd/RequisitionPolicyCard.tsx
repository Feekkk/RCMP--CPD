import { BookOpen, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_TIME_LABEL, REQUISITION_POLICY_RULES } from "@/lib/requisitionPolicy";

export function RequisitionPolicyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Policy &amp; rules
        </CardTitle>
        <CardDescription>
          This is the policy and rules that applies in this system.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
