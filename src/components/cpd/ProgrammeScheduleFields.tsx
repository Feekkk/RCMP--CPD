import { AlertCircle, CalendarDays, Clock3, Info, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { RequiredMark } from "@/components/cpd/RequiredMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  evaluateRequisitionDatePolicy,
  getSchedulePolicySummary,
  LEAD_TIME_LABEL,
  URGENT_APPROVER,
} from "@/lib/requisitionPolicy";
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
  const isUrgent = summary?.isUrgent ?? false;

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b px-4 py-3 text-sm",
        isUrgent ? "bg-amber-500/5" : "bg-muted/40",
      )}
    >
      {isUrgent ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 space-y-0.5">
        <p className={cn("font-medium", isUrgent ? "text-amber-900 dark:text-amber-100" : "text-foreground")}>
          {summary
            ? summary.isUrgent
              ? "Urgent submission"
              : "Within policy"
            : "Lead-time policy"}
        </p>
        <p className="leading-relaxed text-muted-foreground">
          {summary
            ? summary.message
            : `Submit at least ${LEAD_TIME_LABEL} before the programme date. Closer dates need ${URGENT_APPROVER} approval.`}
        </p>
      </div>
    </div>
  );
}

export function ProgrammeScheduleFields({ slots, onChange }: ProgrammeScheduleFieldsProps) {
  const programmeDates = React.useMemo(() => slots.map((slot) => slot.date).filter(Boolean), [slots]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <ProgrammeSchedulePolicyBanner programmeDates={programmeDates} />

      <div className="divide-y">
        {slots.map((slot, idx) => {
          const slotPolicy = slot.date ? evaluateRequisitionDatePolicy(slot.date) : null;

          return (
            <div key={idx} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`slotDate-${idx}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Date
                      <RequiredMark />
                    </Label>
                    {slotPolicy ? (
                      <span
                        className={cn(
                          "text-[11px] font-medium uppercase tracking-wide",
                          slotPolicy.isUrgent
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {slotPolicy.isUrgent ? "Urgent" : "On track"}
                      </span>
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
                  <Label htmlFor={`slotFrom-${idx}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    From
                  </Label>
                  <Input
                    id={`slotFrom-${idx}`}
                    type="time"
                    value={slot.from}
                    onChange={(e) =>
                      onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, from: e.target.value } : s)))
                    }
                  />
                </div>

                <div className="hidden h-10 items-center pb-0.5 text-muted-foreground sm:flex" aria-hidden>
                  →
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`slotTo-${idx}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    To
                  </Label>
                  <Input
                    id={`slotTo-${idx}`}
                    type="time"
                    value={slot.to}
                    onChange={(e) =>
                      onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, to: e.target.value } : s)))
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 justify-self-end text-muted-foreground hover:text-destructive sm:mt-6"
                disabled={slots.length === 1}
                onClick={() => onChange((prev) => prev.filter((_, i) => i !== idx))}
                aria-label={`Remove day ${idx + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {slots.length < 5 ? (
        <div className="border-t bg-muted/20 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed bg-background"
            onClick={() => onChange((prev) => (prev.length >= 5 ? prev : [...prev, { date: "", from: "", to: "" }]))}
          >
            <Plus className="h-4 w-4" />
            Add another day
          </Button>
        </div>
      ) : null}
    </div>
  );
}
