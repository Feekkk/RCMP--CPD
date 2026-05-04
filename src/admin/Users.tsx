import { Users as UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/admin/Sidebar";

export function AdminUsersPage() {
  const users = [
    { staffId: "620000", name: "Wan Afiq", email: "email@gmail.com", role: "Staff", status: "Active" },
    { staffId: "620001", name: "Nur Syafiqah", email: "nur.sya@unikl.edu.my", role: "Staff", status: "Active" },
    { staffId: "610010", name: "Admin RCMP", email: "admin@unikl.edu.my", role: "Admin", status: "Active" },
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Users</h1>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User management</CardTitle>
              <CardDescription>View staff users and roles (UI-only).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Staff ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Role</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.staffId}>
                        <TableCell className="font-medium">{u.staffId}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">{u.role}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{u.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

