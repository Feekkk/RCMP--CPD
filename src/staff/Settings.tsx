import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StaffSidebar } from "@/staff/Sidebar";
import { cn } from "@/lib/utils";

type MicrosoftProfile = {
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  email: string | null;
  preferredUsername: string | null;
  picture: string | null;
};

type SessionUser = {
  staffId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  departmentId: number;
  departmentName: string;
  roleId: number;
  roleName: string;
  authProvider: "microsoft" | "password";
  microsoft: MicrosoftProfile | null;
  redirect: string;
};

async function fetchSessionUser(): Promise<SessionUser> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as SessionUser & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Unable to load profile.");
  }
  return data;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "—", lastName: "—" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        readOnly
        disabled
        value={value}
        className={cn("bg-muted/50 opacity-100", "disabled:cursor-default disabled:opacity-100")}
      />
    </div>
  );
}

export function Settings() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchSessionUser,
    retry: false,
  });

  const microsoft = data?.microsoft ?? null;
  const displayName = microsoft?.name ?? data?.fullName ?? "—";
  const email = microsoft?.email ?? microsoft?.preferredUsername ?? data?.email ?? "—";
  const { firstName, lastName } = microsoft?.givenName
    ? {
        firstName: microsoft.givenName,
        lastName: microsoft.familyName ?? "—",
      }
    : data?.fullName
      ? splitFullName(data.fullName)
      : { firstName: "—", lastName: "—" };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>

          <Card className="mt-6 overflow-hidden">
            <div
              className="relative h-44 w-full bg-muted md:h-56"
              style={{
                backgroundImage: "url(/bgm.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/15 to-transparent" />
            </div>

            <CardContent className="relative -mt-10 grid gap-6 p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading profile…</span>
                </div>
              ) : isError ? (
                <div className="grid gap-4 py-8 text-center">
                  <p className="text-sm font-medium text-destructive">
                    {error instanceof Error ? error.message : "Unable to load profile."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sign in with Microsoft SSO to view your profile details.
                  </p>
                  <Button asChild className="mx-auto w-fit">
                    <Link to="/login">Go to login</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                        {microsoft?.picture ? (
                          <AvatarImage src={microsoft.picture} alt={displayName} />
                        ) : null}
                        <AvatarFallback>{initialsFromName(displayName)}</AvatarFallback>
                      </Avatar>

                      <div className="pb-1">
                        <p className="text-lg font-semibold leading-none">{displayName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{data.roleName}</Badge>
                          <Badge variant="outline">{data.departmentName}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Profile details are synced from Microsoft SSO and your CPD account. Contact HR or admin to update
                    department, role, or phone number.
                  </p>

                  <Separator />

                  <div className="grid gap-1">
                    <p className="text-sm font-semibold tracking-tight">Personal details</p>
                    <p className="text-sm text-muted-foreground">Read-only information from your sign-in.</p>
                  </div>

                  <div className="grid gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReadOnlyField id="firstName" label="First name" value={firstName} />
                      <ReadOnlyField id="lastName" label="Last name" value={lastName} />
                      <ReadOnlyField id="staffId" label="Staff ID" value={String(data.staffId)} />
                      <ReadOnlyField id="mobile" label="Mobile number" value={data.phoneNumber ?? "—"} />
                      <ReadOnlyField id="email" label="Email" value={email} />
                      <ReadOnlyField id="department" label="Department" value={data.departmentName} />
                      <ReadOnlyField id="role" label="Role" value={data.roleName} />
                      <ReadOnlyField
                        id="signIn"
                        label="Sign-in method"
                        value={data.authProvider === "microsoft" ? "Microsoft SSO" : "Staff ID"}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
