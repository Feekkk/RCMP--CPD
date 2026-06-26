import { Settings as SettingsIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HODSidebar } from "@/HOD/Sidebar";

export function HODSettingsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Head of Department</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>HOD preferences</CardTitle>
              <CardDescription>Notifications and department defaults.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
