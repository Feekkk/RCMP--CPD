import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, LogIn, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-xl overflow-hidden">
          <CardHeader className="space-y-3">
            <Button variant="ghost" asChild className="-ml-2 w-fit px-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">System</p>
                  <CardTitle className="font-display text-3xl tracking-tight">Page not found</CardTitle>
                </div>
              </div>

              <img src="/rcmp-real.png" alt="UniKL RCMP logo" className="h-12 w-auto object-contain" />
            </div>

            <CardDescription>
              We couldn’t find <span className="font-medium text-foreground">{location.pathname}</span>. It may have been moved or the
              link is incorrect.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Try one of these:</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    Go to homepage
                  </Link>
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              If you believe this is an error, contact the system administrator and share the URL you tried to open.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default NotFound;
