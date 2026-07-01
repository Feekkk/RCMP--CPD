import { History as HistoryIcon } from "lucide-react";

import { RequisitionHistoryPanel } from "@/components/cpd/RequisitionHistoryPanel";
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
              <h1 className="font-display text-2xl font-bold tracking-tight">Activity Log</h1>
            </div>
          </div>

          <RequisitionHistoryPanel
            description="Your requisitions — expand a row for approval progress. Rejected items show HOD remarks with options to edit and resubmit."
            showBudget
            editPath="/staff/requisition"
            pageSize={100}
          />
        </div>
      </div>
    </main>
  );
}
