import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, FileText, History, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/requisitions", label: "Requisitions", icon: FileText },
  { to: "/admin/report", label: "Report", icon: BarChart3 },
  { to: "/admin/history", label: "History", icon: History },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

const userItems = [{ to: "/admin/users", label: "User", icon: Users }] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <img src="/unikl-rcmp.png" alt="logo" width={40} height={40} className="h-18 w-20 object-contain" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground">CPD Portal</p>
            <p className="text-xs font-medium text-muted-foreground">Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-auto p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menu</p>
          <div className="grid gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
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

          <p className="mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">System</p>
          <div className="grid gap-1">
            {userItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
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
            onClick={() => {
              onNavigate?.();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-72 border-r bg-background md:block">
        <SidebarBody />
      </aside>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-3 backdrop-blur md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src="/unikl-rcmp.png" alt="logo" className="h-9 w-9 object-contain" />
          <p className="font-display text-sm font-bold">CPD Portal</p>
        </div>
        <div className="w-9" />
      </div>
    </>
  );
}

