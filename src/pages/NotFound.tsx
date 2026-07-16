import * as React from "react";
import Lottie from "lottie-react";
import { Link, useLocation } from "react-router-dom";
import { Home, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const [lonelyAnimation, setLonelyAnimation] = React.useState<object | null>(null);

  React.useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/Lonely%20404.json")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLonelyAnimation(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-end px-6 py-6">
        <img src="/rcmp-real.png" alt="UniKL RCMP logo" className="h-12 w-auto object-contain" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {lonelyAnimation ? (
          <Lottie animationData={lonelyAnimation} loop className="h-72 w-72 sm:h-96 sm:w-96" />
        ) : (
          <div className="h-72 w-72 sm:h-96 sm:w-96" />
        )}

        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          We couldn’t find <span className="font-medium text-foreground">{location.pathname}</span>. It may have been
          moved or the link is incorrect.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Go to homepage
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          If you believe this is an error, contact the system administrator and share the URL you tried to open.
        </p>
      </div>
    </main>
  );
};

export default NotFound;
