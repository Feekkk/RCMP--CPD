import { FileSearch } from "lucide-react";

import { RequisitionHistoryPanel } from "@/components/cpd/RequisitionHistoryPanel";
import { HODSidebar } from "@/HOD/Sidebar";

export function HODTrackRequisitionPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">My Requisition</h1>
            </div>
          </div>

          <RequisitionHistoryPanel
            neutralStyle
            description="Expand a row for approval progress. Rejected items show remarks with options to edit and resubmit."
            showBudget
            editPath="/hod/requisitions"
            pageSize={100}
          />
        </div>
      </div>
    </main>
  );
}
