import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StaffSidebar } from "@/staff/Sidebar";

type GraphEndpointResult =
  | { status: number; data: unknown }
  | { status: number; error: string; details?: unknown };

type EntraProfileResponse = {
  source: string;
  fetchedAt: string;
  scopes: string;
  idTokenClaims: Record<string, unknown>;
  microsoftGraph: Record<string, GraphEndpointResult | { tokenError: string }>;
};

async function fetchEntraProfile(): Promise<EntraProfileResponse> {
  const res = await fetch("/api/auth/entra/profile", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as EntraProfileResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Unable to load Entra ID profile.");
  }
  return data;
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ClaimGrid({ claims }: { claims: Record<string, unknown> }) {
  const entries = Object.entries(claims).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No claims returned.</p>;
  }
  return (
    <div className="rounded-lg border">
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">{key}</div>
            <div className="break-all bg-background px-3 py-2 text-sm">
              {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "—")}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function GraphSection({ graph }: { graph: EntraProfileResponse["microsoftGraph"] }) {
  const entries = Object.entries(graph);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No Graph responses.</p>;
  }

  return (
    <div className="grid gap-4">
      {entries.map(([name, result]) => {
        const isError = "error" in result || "tokenError" in result;
        return (
          <div key={name} className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{name}</p>
              {"status" in result ? <Badge variant={isError ? "destructive" : "secondary"}>{result.status}</Badge> : null}
              {"tokenError" in result ? <Badge variant="destructive">No token</Badge> : null}
            </div>
            {"tokenError" in result ? (
              <p className="text-sm text-destructive">{result.tokenError}</p>
            ) : "error" in result ? (
              <JsonBlock value={{ error: result.error, details: result.details }} />
            ) : (
              <JsonBlock value={result.data} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Settings() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["auth", "entra", "profile"],
    queryFn: fetchEntraProfile,
    retry: false,
  });

  const meResult = data?.microsoftGraph["GET /me"];
  const graphDisplayName =
    meResult && "data" in meResult && meResult.data && typeof meResult.data === "object"
      ? (meResult.data as { displayName?: string }).displayName
      : null;

  const displayName =
    (typeof data?.idTokenClaims?.name === "string" && data.idTokenClaims.name) ||
    graphDisplayName ||
    "Entra ID user";

  const email =
    (typeof data?.idTokenClaims?.preferred_username === "string" && data.idTokenClaims.preferred_username) ||
    (typeof data?.idTokenClaims?.email === "string" && data.idTokenClaims.email) ||
    (typeof data?.idTokenClaims?.upn === "string" && data.idTokenClaims.upn) ||
    null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Entra ID test profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live data from Microsoft Entra ID only — not loaded from the CPD database.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isLoading || isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh from Entra
            </Button>
          </div>

          <Card className="mt-6">
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Fetching from Microsoft Entra ID…</span>
                </div>
              ) : isError ? (
                <div className="grid gap-4 py-8 text-center">
                  <p className="text-sm font-medium text-destructive">
                    {error instanceof Error ? error.message : "Unable to load Entra ID profile."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sign in with Microsoft SSO, then return here. Existing sessions from before this update may need a
                    fresh sign-in so the server can store Entra tokens.
                  </p>
                  <Button asChild className="mx-auto w-fit">
                    <Link to="/login">Go to login</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{displayName}</Badge>
                    {email ? <Badge variant="outline">{email}</Badge> : null}
                    <Badge variant="secondary">Scopes: {data.scopes}</Badge>
                    <span className="text-xs text-muted-foreground">Fetched {new Date(data.fetchedAt).toLocaleString()}</span>
                  </div>

                  <Separator />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ID token claims</CardTitle>
                      <CardDescription>
                        Returned at sign-in from Entra ID (OpenID Connect). No CPD database lookup.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <ClaimGrid claims={data.idTokenClaims} />
                      <JsonBlock value={data.idTokenClaims} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Microsoft Graph API</CardTitle>
                      <CardDescription>
                        Live calls to Graph using your SSO access token. Some endpoints may fail if IT has not granted
                        extra permissions — errors are shown for testing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GraphSection graph={data.microsoftGraph} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
