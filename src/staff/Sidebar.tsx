import { Link, NavLink, useNavigate } from "react-router-dom";
import { Clock, FileText, History, LayoutDashboard, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff/requisition", label: "Requisition", icon: FileText },
  { to: "/staff/history", label: "History", icon: History },
  { to: "/staff/settings", label: "Setting", icon: Settings },
] as const;

export function StaffSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-72 border-r bg-background md:block">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b px-6 py-5">
            <img src="/rcmp.png" alt="logo" width={40} height={40} className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground">CPD Portal</p>
            <p className="text-xs font-medium text-muted-foreground">Staff</p>
          </div>
        </div>

        <nav className="flex-1 overflow-auto p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          <div className="grid gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    isActive && "bg-accent text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/login")}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>

        </div>
      </div>
    </aside>
  );
}

