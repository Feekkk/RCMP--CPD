import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { dashboardPathForRole } from "@/lib/authApi";

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProtectedRoute({ roles }: { roles: number[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.roleId)) {
    return <Navigate to={dashboardPathForRole(user.roleId)} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to={dashboardPathForRole(user.roleId)} replace />;
  }

  return <Outlet />;
}
