import { History as HistoryIcon } from "lucide-react";

import { RequisitionLogsPanel } from "@/components/cpd/RequisitionLogsPanel";
import { StaffSidebar } from "@/staff/Sidebar";

export function History() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
            </div>
          </div>

          <RequisitionLogsPanel />
        </div>
      </div>
    </main>
  );
}
