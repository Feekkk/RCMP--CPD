import { FileSearch, History as HistoryIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { RequisitionLogsPanel } from "@/components/cpd/RequisitionLogsPanel";
import { Button } from "@/components/ui/button";
import { HODSidebar } from "@/HOD/Sidebar";

export function HODHistoryPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HistoryIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Department History</h1>
              </div>
            </div>
            <Button asChild>
              <Link to="/hod/requisition/track">
                <FileSearch className="h-4 w-4" />
                My Requisition
              </Link>
            </Button>
          </div>

          <RequisitionLogsPanel scope="department" />
        </div>
      </div>
    </main>
  );
}
