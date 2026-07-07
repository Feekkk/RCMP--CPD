import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { AlertCircle, CalendarCheck, Clock, Loader2, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";

import { RequisitionStatusBadge } from "@/components/cpd/RequisitionStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchHodRequisitionHistory,
  type RequisitionHistoryItem,
} from "@/lib/requisitionsApi";
import {
  formatProgrammeSlotSchedule,
  statusDetailLabel,
  TRAFFIC_LIGHT_STYLES,
  statusGroupTrafficLight,
} from "@/lib/requisitionStatus";
import { cn } from "@/lib/utils";
import { HODSidebar } from "@/HOD/Sidebar";

type ProgrammeEvent = {
  requisitionId: number;
  id: string;
  title: string;
  staffName: string;
  status: string;
  statusGroup: RequisitionHistoryItem["statusGroup"];
  date: string;
  from: string;
  to: string;
  venue: string;
};

function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

async function fetchAllDepartmentRequisitionsForCalendar(): Promise<RequisitionHistoryItem[]> {
  const firstPage = await fetchHodRequisitionHistory({ phase: "all", page: 1, pageSize: 100 });
  const items = [...firstPage.requisitions];
  if (firstPage.totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        fetchHodRequisitionHistory({ phase: "all", page: index + 2, pageSize: 100 }),
      ),
    );
    for (const page of pages) items.push(...page.requisitions);
  }
  return items;
}

function flattenRequisitionEvents(items: RequisitionHistoryItem[]): ProgrammeEvent[] {
  const events: ProgrammeEvent[] = [];
  for (const item of items) {
    const slots = item.programmeSlots?.length
      ? item.programmeSlots
      : item.programmeDates.map((date) => ({ date, from: "", to: "" }));
    for (const slot of slots) {
      if (!slot.date) continue;
      events.push({
        requisitionId: item.requisitionId,
        id: item.id,
        title: item.title,
        staffName: item.staffName,
        status: item.status,
        statusGroup: item.statusGroup,
        date: slot.date,
        from: slot.from,
        to: slot.to,
        venue: item.venue,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.from.localeCompare(b.from));
}

export function HODCalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const { data: requisitions = [], isLoading, isError, error } = useQuery({
    queryKey: ["requisitions", "hod", "history", "calendar"],
    queryFn: fetchAllDepartmentRequisitionsForCalendar,
  });

  const events = useMemo(() => flattenRequisitionEvents(requisitions), [requisitions]);

  const eventDates = useMemo(() => {
    const unique = new Map<string, Date>();
    for (const event of events) {
      if (!unique.has(event.date)) unique.set(event.date, parseDateKey(event.date));
    }
    return Array.from(unique.values());
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selected) return [];
    return events.filter((event) => isSameDay(parseDateKey(event.date), selected));
  }, [events, selected]);

  const defaultMonth = selected ?? eventDates[0] ?? new Date();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Department Calendar</h1>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/hod/dashboard">Back to dashboard</Link>
            </Button>
          </div>

          {isError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load calendar</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : "Try again later."}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-6 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Programme calendar</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading department requisitions…"
                    : events.length
                      ? `${events.length} scheduled slot${events.length === 1 ? "" : "s"} across your department`
                      : "No programme dates scheduled yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading calendar…
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={setSelected}
                    defaultMonth={defaultMonth}
                    modifiers={{ hasProgramme: eventDates }}
                    modifiersClassNames={{
                      hasProgramme:
                        "font-semibold text-primary after:absolute after:bottom-2 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                    }}
                    className="w-full p-0"
                    classNames={{
                      months: "w-full",
                      month: "w-full space-y-4",
                      caption: "relative flex items-center justify-center pb-2",
                      caption_label: "text-base font-semibold",
                      nav_button: "h-9 w-9 opacity-70 hover:opacity-100",
                      table: "w-full border-collapse",
                      head_row: "flex w-full",
                      head_cell: "flex-1 text-center text-sm font-medium text-muted-foreground",
                      row: "mt-2 flex w-full",
                      cell: "relative flex-1 p-0 text-center [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      day: "h-11 w-full rounded-md p-0 text-sm font-normal aria-selected:opacity-100 sm:h-12 sm:text-base",
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selected ? format(selected, "EEEE, d MMMM yyyy") : "Select a date"}
                </CardTitle>
                <CardDescription>
                  {selectedEvents.length
                    ? `${selectedEvents.length} programme${selectedEvents.length === 1 ? "" : "s"} on this day`
                    : "Department programme dates and times appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading programmes…
                  </div>
                ) : selectedEvents.length ? (
                  selectedEvents.map((event) => {
                    const light = statusGroupTrafficLight(event.statusGroup);
                    const styles = TRAFFIC_LIGHT_STYLES[light];

                    return (
                      <div
                        key={`${event.requisitionId}-${event.date}-${event.from}-${event.to}`}
                        className={cn("grid gap-3 rounded-lg border p-4", styles.border, styles.bg)}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{event.title || "Untitled programme"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{event.id}</p>
                          </div>
                          <RequisitionStatusBadge
                            statusGroup={event.statusGroup}
                            label={statusDetailLabel(event.status)}
                          />
                        </div>
                        <div className="grid gap-1.5 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            {event.staffName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {formatProgrammeSlotSchedule(event)}
                          </p>
                          {event.venue ? (
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {event.venue}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    {events.length
                      ? "No programmes on this date. Select a highlighted day on the calendar."
                      : "No department requisitions with programme dates yet."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
