import { FileSearch, History as HistoryIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { RequisitionLogsPanel } from "@/components/cpd/RequisitionLogsPanel";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/admin/Sidebar";

export function AdminHistoryPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HistoryIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
              </div>
            </div>
            <Button asChild>
              <Link to="/admin/requisition/track">
                <FileSearch className="h-4 w-4" />
                Track Requisition
              </Link>
            </Button>
          </div>

          <RequisitionLogsPanel />
        </div>
      </div>
    </main>
  );
}
