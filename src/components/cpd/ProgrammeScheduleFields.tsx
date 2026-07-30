import { AlertCircle, Info, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  evaluateRequisitionDatePolicy,
  getSchedulePolicySummary,
  LEAD_TIME_LABEL,
  URGENT_APPROVER,
} from "@/lib/requisitionPolicy";
import { RequiredMark } from "@/components/cpd/RequiredMark";
import { cn } from "@/lib/utils";

export type ProgrammeSlot = {
  date: string;
  from: string;
  to: string;
};

type ProgrammeScheduleFieldsProps = {
  slots: ProgrammeSlot[];
  onChange: React.Dispatch<React.SetStateAction<ProgrammeSlot[]>>;
};

function ProgrammeSchedulePolicyBanner({ programmeDates }: { programmeDates: string[] }) {
  const summary = getSchedulePolicySummary(programmeDates);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        summary?.isUrgent
          ? "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-50"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      <div className="flex items-start gap-2.5">
        {summary?.isUrgent ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">
            {summary
              ? summary.isUrgent
                ? "Urgent submission policy applies"
                : "Submission policy"
              : "Submission policy reminder"}
          </p>
          <p className="leading-relaxed">
            {summary
              ? summary.message
              : `Submit at least ${LEAD_TIME_LABEL} before the programme date. Closer dates are urgent and need ${URGENT_APPROVER} approval.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProgrammeScheduleFields({ slots, onChange }: ProgrammeScheduleFieldsProps) {
  const programmeDates = React.useMemo(() => slots.map((slot) => slot.date).filter(Boolean), [slots]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <Label>
          Programme schedule
          <RequiredMark />
        </Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange((prev) => [...prev, { date: "", from: "", to: "" }])}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <ProgrammeSchedulePolicyBanner programmeDates={programmeDates} />

      <div className="grid gap-2">
        {slots.map((slot, idx) => {
          const slotPolicy = slot.date ? evaluateRequisitionDatePolicy(slot.date) : null;

          return (
            <div
              key={idx}
              className="grid items-end gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`slotDate-${idx}`} className="text-sm">
                    Date
                    <RequiredMark />
                  </Label>
                  {slotPolicy ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide",
                        slotPolicy.isUrgent
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                          : "border-primary/30 bg-primary/5 text-primary",
                      )}
                    >
                      {slotPolicy.isUrgent ? "Urgent" : "On track"}
                    </Badge>
                  ) : null}
                </div>
                <Input
                  id={`slotDate-${idx}`}
                  type="date"
                  value={slot.date}
                  onChange={(e) =>
                    onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, date: e.target.value } : s)))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`slotFrom-${idx}`}>From</Label>
                <Input
                  id={`slotFrom-${idx}`}
                  type="time"
                  value={slot.from}
                  onChange={(e) =>
                    onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, from: e.target.value } : s)))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`slotTo-${idx}`}>To</Label>
                <Input
                  id={`slotTo-${idx}`}
                  type="time"
                  value={slot.to}
                  onChange={(e) =>
                    onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, to: e.target.value } : s)))
                  }
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                disabled={slots.length === 1}
                onClick={() => onChange((prev) => prev.filter((_, i) => i !== idx))}
                aria-label="Remove schedule row"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
