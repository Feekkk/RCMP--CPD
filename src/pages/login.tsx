import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { devLogin, fetchDevAccounts, type DevAccount } from "@/lib/authApi";

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = React.useState(false);
  const [devAccounts, setDevAccounts] = React.useState<DevAccount[]>([]);
  const [devAccountsLoading, setDevAccountsLoading] = React.useState(false);
  const [devEmail, setDevEmail] = React.useState("");
  const [devLoading, setDevLoading] = React.useState(false);
  const [devError, setDevError] = React.useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  React.useEffect(() => {
    const ssoError = searchParams.get("sso_error");
    if (ssoError) {
      setError(ssoError);
      const next = new URLSearchParams(searchParams);
      next.delete("sso_error");
      next.delete("sso_code");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    if (!isDev) return;

    let cancelled = false;
    setDevAccountsLoading(true);

    fetchDevAccounts()
      .then((accounts) => {
        if (!cancelled) {
          setDevAccounts(accounts);
          if (accounts.length > 0) {
            setDevEmail(accounts[0].email);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDevAccounts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDevAccountsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isDev]);

  const startMicrosoftLogin = () => {
    setError(null);
    setSsoLoading(true);
    window.location.href = "/api/auth/microsoft";
  };

  const handleDevLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDevError(null);

    if (!devEmail) {
      setDevError("Choose a registered staff account.");
      return;
    }

    setDevLoading(true);
    try {
      const { redirect } = await devLogin(devEmail);
      navigate(redirect);
    } catch (err) {
      setDevError(err instanceof Error ? err.message : "Dev sign-in failed.");
    } finally {
      setDevLoading(false);
    }
  };

  const showDevLogin = isDev && (devAccountsLoading || devAccounts.length > 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-2">
            <Button variant="ghost" asChild className="-ml-2 w-fit px-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                back
              </Link>
            </Button>
            <div className="flex justify-center pb-2">
              <img src="/rcmp-real.png" alt="UniKL RCMP logo" className="h-20 w-auto object-contain" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4">
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  Access the System
                </span>
              </div>

              <div className="grid gap-4">
                <p className="text-center text-sm text-muted-foreground">
                  Sign in with UniKL Microsoft account to continue. System does not store any data from your account.
                </p>

                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={ssoLoading}
                  title="Sign in with your UniKL Microsoft account"
                  onClick={startMicrosoftLogin}
                >
                  {ssoLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <MicrosoftLogo className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 text-center">Microsoft SSO</span>
                </Button>

                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

                {showDevLogin ? (
                  <>
                    <div className="relative">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                        Dev only
                      </span>
                    </div>

                    <form onSubmit={handleDevLogin} className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="dev-email">Staff account</Label>
                        {devAccountsLoading ? (
                          <div className="flex h-10 items-center justify-center rounded-md border border-input text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading accounts…
                          </div>
                        ) : (
                          <Select value={devEmail} onValueChange={setDevEmail} required>
                            <SelectTrigger id="dev-email">
                              <SelectValue placeholder="Select a staff account" />
                            </SelectTrigger>
                            <SelectContent>
                              {devAccounts.map((account) => (
                                <SelectItem key={account.email} value={account.email}>
                                  {account.email} ({account.roleName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Button
                        type="submit"
                        variant="secondary"
                        className="w-full"
                        disabled={devLoading || devAccountsLoading || !devEmail}
                      >
                        {devLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                          </>
                        ) : (
                          "Continue as dev"
                        )}
                      </Button>
                      {devError ? (
                        <p className="text-sm font-medium text-destructive">{devError}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Only staff accounts registered in the database can be used for dev sign-in.
                      </p>
                    </form>
                  </>
                ) : null}

                <p className="text-center text-sm text-muted-foreground">
                  Cannot access the system?{" "}
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link to="mailto:hcd@unikl.edu.my">Contact Admin</Link>
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Login;
