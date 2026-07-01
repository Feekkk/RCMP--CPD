import { FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { AdminSidebar } from "@/admin/Sidebar";
import { RequisitionForm } from "@/components/cpd/RequisitionForm";
import { Button } from "@/components/ui/button";

export function AdminRequisitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const editId = editParam ? Number.parseInt(editParam, 10) : null;
  const validEditId = editId && Number.isFinite(editId) && editId > 0 ? editId : null;

  const handleEditIdChange = (id: number | null) => {
    if (id) {
      setSearchParams({ edit: String(id) });
    } else {
      setSearchParams({});
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Requisitions</h1>
            </div>
            <Button
              type="button"
              asChild
            >
              <a href="/admin/history">
                <FileText className="h-4 w-4" />
                My Requisitions
              </a>
            </Button>
          </div>

          <RequisitionForm editId={validEditId} onEditIdChange={handleEditIdChange} />
        </div>
      </div>
    </main>
  );
}
