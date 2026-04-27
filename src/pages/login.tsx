import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-2">
            <Button variant="ghost" asChild className="-ml-2 w-fit px-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to homepage
              </Link>
            </Button>
            <CardTitle className="font-display text-3xl">Staff Login</CardTitle>
            <CardDescription>Welcome back !</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4">
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  Access the System
                </span>
              </div>

              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="number">Staff ID</Label>
                  <Input id="number" type="text" placeholder="Enter your staff ID" autoComplete="staff-id" />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox />
                    Remember me
                  </label>
                  <Button variant="link" asChild className="h-auto p-0 text-sm">
                    <Link to="#">Forgot password?</Link>
                  </Button>
                </div>

                <Button type="submit" className="w-full">
                  Login
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Cannot access the system?{" "}
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link to="mailto:hcd@unikl.edu.my">Contact Admin</Link>
                  </Button>
                </p>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Login;
