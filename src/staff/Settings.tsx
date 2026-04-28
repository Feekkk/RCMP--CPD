import * as React from "react";
import { Eye, EyeOff, Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StaffSidebar } from "@/staff/Sidebar";

export function Settings() {
  const [firstName, setFirstName] = React.useState("Wan");
  const [lastName, setLastName] = React.useState("Afiq");
  const [mobile, setMobile] = React.useState("+971 50 827 8229");
  const [email, setEmail] = React.useState("email@gmail.com");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [message, setMessage] = React.useState<string | null>(null);
  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="md:pl-72">
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                    <AvatarImage src="/pfp.jpg" alt="Profile picture" />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>

                  <div className="pb-1">
                    <p className="text-lg font-semibold leading-none">
                      {firstName} {lastName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Staff profile</p>
                  </div>
                </div>

                <Button
                  className="w-full sm:w-auto"
                  onClick={() => setMessage("Saved (UI only).")}
                  type="button"
                >
                  Save changes
                </Button>
              </div>

              {message ? <p className="text-sm font-medium text-muted-foreground">{message}</p> : null}

              <Separator />

              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight">Personal details</p>
                <p className="text-sm text-muted-foreground">Update your personal information.</p>
              </div>

              <form
                className="grid gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessage("Saved (UI only).");
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mobile">Mobile number</Label>
                    <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email ID</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-1">
                  <p className="text-sm font-semibold tracking-tight">Change password</p>
                  <p className="text-sm text-muted-foreground">Leave blank if you don’t want to change it.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        className="pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {passwordMismatch ? (
                      <p className="text-xs font-medium text-destructive">Passwords do not match.</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="submit" className="w-full sm:w-auto">
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

