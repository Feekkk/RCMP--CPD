import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";

import { EntraProfileDetails } from "@/components/cpd/EntraProfileDetails";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HODSidebar } from "@/HOD/Sidebar";

type EntraProfileResponse = {
  source: string;
  fetchedAt: string;
  profile: {
    oid: string | null;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
    officeLocation: string | null;
  };
  graphPath: string;
};

async function fetchEntraProfile(): Promise<EntraProfileResponse> {
  const res = await fetch("/api/auth/entra/profile", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as EntraProfileResponse & {
    error?: string;
    hint?: string;
  };
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        data.hint ??
          "API route not found. Restart the Node API (npm run dev:full locally, or redeploy + restart on Plesk). Check /api/ping for apiBuild 7.",
      );
    }
    throw new Error(data.error ?? "Unable to load Microsoft Graph profile.");
  }
  return data;
}

export function HODSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["auth", "entra", "profile"],
    queryFn: fetchEntraProfile,
    retry: false,
  });

  React.useEffect(() => {
    if (!isError) return;
    toast({
      variant: "destructive",
      title: "Unable to load profile",
      description: error instanceof Error ? error.message : "Sign in with Microsoft SSO first.",
    });
  }, [isError, error, toast]);

  const pending = isLoading || isError || !data;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HODSidebar />
      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <div className="container mx-auto py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Head of Department
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your personal data is managed by Microsoft Entra.
                </p>
              </div>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>HOD Profile</CardTitle>
              <CardDescription>
              Read-only fields for your organisation profile. We do not store and manage any of your personal data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntraProfileDetails
                profile={data?.profile}
                fetchedAt={data?.fetchedAt}
                pending={pending}
                fallbackInitials="HD"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
