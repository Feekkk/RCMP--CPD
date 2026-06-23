import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = React.useState(false);

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

  const startMicrosoftLogin = () => {
    setError(null);
    setSsoLoading(true);
    window.location.href = "/api/auth/microsoft";
  };

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
