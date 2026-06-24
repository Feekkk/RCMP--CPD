import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/admin/Sidebar";

type EntraProfile = {
  oid: string | null;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
};

type EntraProfileResponse = {
  source: string;
  fetchedAt: string;
  profile: EntraProfile;
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

function displayValue(value: string | null) {
  return value?.trim() ? value : "—";
}

function initialsFromName(name: string | null) {
  if (!name?.trim()) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function AdminSettingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["auth", "entra", "profile"],
    queryFn: fetchEntraProfile,
    retry: false,
  });

  const profile = data?.profile;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your personal data is managed by Microsoft Entra.
                </p>
              </div>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>
                Read-only fields for your organisation profile. Please contact the IT team if you need to update your
                profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Fetching from Microsoft Graph…</span>
                </div>
              ) : isError ? (
                <div className="grid gap-4 py-8 text-center">
                  <p className="text-sm font-medium text-destructive">
                    {error instanceof Error ? error.message : "Unable to load profile."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sign in with Microsoft SSO, then return here. If you recently updated the server, sign in again so
                    Entra tokens are stored in your session.
                  </p>
                  <Button asChild className="mx-auto w-fit">
                    <Link to="/login">Go to login</Link>
                  </Button>
                </div>
              ) : profile ? (
                <div className="grid gap-6">
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
                    <Avatar className="h-14 w-14 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initialsFromName(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold tracking-tight">
                        {displayValue(profile.name)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{displayValue(profile.email)}</p>
                      {data.fetchedAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last updated {new Date(data.fetchedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entra ID</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="hidden md:table-cell">Job Title</TableHead>
                          <TableHead className="hidden lg:table-cell">Office Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="max-w-[12rem] break-all font-mono text-xs sm:max-w-none sm:text-sm">
                            {displayValue(profile.oid)}
                          </TableCell>
                          <TableCell className="font-medium">{displayValue(profile.name)}</TableCell>
                          <TableCell className="break-all">{displayValue(profile.email)}</TableCell>
                          <TableCell className="hidden md:table-cell">{displayValue(profile.jobTitle)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{displayValue(profile.officeLocation)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Job title</p>
                      <p className="mt-1 text-sm">{displayValue(profile.jobTitle)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Office location
                      </p>
                      <p className="mt-1 text-sm">{displayValue(profile.officeLocation)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
