import { Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSidebar } from "@/admin/Sidebar";

export function AdminSettingsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>

          <Card className="mt-6 max-w-xl">
            <CardHeader>
              <CardTitle>System settings</CardTitle>
              <CardDescription>Basic admin preferences (UI-only).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" placeholder="Admin name" />
              </div>
              <Button className="w-fit">Save</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

