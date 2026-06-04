import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Info, Loader2, Search, Users as UsersIcon, UserX } from "lucide-react";
import * as React from "react";

import { AdminSidebar } from "@/admin/Sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const HOD_ROLE_ID = 3;

type StaffMember = {
  staffId: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
};

type DepartmentGroup = {
  departmentId: number;
  departmentName: string;
  staffCount: number;
  hasHod: boolean;
  hods: Array<{ staffId: number; fullName: string; email: string }>;
  staff: StaffMember[];
};

type UsersByDepartmentResponse = {
  departments: DepartmentGroup[];
  departmentsWithoutHod: Array<{ departmentId: number; departmentName: string }>;
  summary: {
    totalDepartments: number;
    totalStaff: number;
    departmentsWithoutHodCount: number;
  };
};

function RoleBadge({ roleId, roleName }: { roleId: number; roleName: string }) {
  if (roleId === HOD_ROLE_ID) {
    return (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-700">
        {roleName}
      </Badge>
    );
  }
  if (roleId === 2) {
    return <Badge variant="default">{roleName}</Badge>;
  }
  if (roleId === 4) {
    return <Badge variant="outline">{roleName}</Badge>;
  }
  return <Badge variant="secondary">{roleName}</Badge>;
}

async function fetchUsersByDepartment(): Promise<UsersByDepartmentResponse> {
  const res = await fetch("/api/admin/users-by-department");
  const data = (await res.json().catch(() => ({}))) as UsersByDepartmentResponse & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Unable to load users.");
  }
  return data;
}

export function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [showOnlyMissingHod, setShowOnlyMissingHod] = React.useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "users-by-department"],
    queryFn: fetchUsersByDepartment,
  });

  const searchLower = search.trim().toLowerCase();

  const filteredDepartments = React.useMemo(() => {
    if (!data?.departments) return [];
    return data.departments.filter((dept) => {
      if (showOnlyMissingHod && dept.hasHod) return false;
      if (!searchLower) return true;
      if (dept.departmentName.toLowerCase().includes(searchLower)) return true;
      return dept.staff.some(
        (s) =>
          s.fullName.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          String(s.staffId).includes(searchLower),
      );
    });
  }, [data?.departments, searchLower, showOnlyMissingHod]);

  const missingHod = data?.departmentsWithoutHod ?? [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Users</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading staff by department…</span>
            </div>
          ) : null}

          {isError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load users</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Check that the API and database are running."}
              </AlertDescription>
            </Alert>
          ) : null}

          {data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total staff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold tracking-tight">{data.summary.totalStaff}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold tracking-tight">{data.summary.totalDepartments}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Without HOD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={cn(
                        "font-display text-2xl font-bold tracking-tight",
                        data.summary.departmentsWithoutHodCount > 0 && "text-yellow-700 dark:text-yellow-300",
                      )}
                    >
                      {data.summary.departmentsWithoutHodCount}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {missingHod.length > 0 ? (
                <Alert
                  className="mt-6 border-yellow-500/30 bg-yellow-500/10 text-foreground dark:bg-yellow-500/5 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-300"
                >
                  <Info className="h-4 w-4" />
                  <AlertTitle>Head of Department not assigned</AlertTitle>
                  <AlertDescription>
                    <p>
                      {missingHod.length === 1
                        ? "1 department does not have a Head of Department (HOD) assigned yet."
                        : `${missingHod.length} departments do not have a Head of Department (HOD) assigned yet.`}{" "}
                      Assign a staff member the <strong>Head of Department</strong> role in that department so
                      requisitions can be reviewed.
                    </p>
                    <ul className="mt-3 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-sm text-muted-foreground">
                      {missingHod.map((d) => (
                        <li key={d.departmentId}>{d.departmentName}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mt-6 border-emerald-500/30 bg-emerald-500/10 [&>svg]:text-emerald-700 dark:[&>svg]:text-emerald-300">
                  <Info className="h-4 w-4" />
                  <AlertTitle>All departments have a HOD</AlertTitle>
                  <AlertDescription>
                    Every department has at least one staff member with the Head of Department role.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Staff by department</CardTitle>
                  <CardDescription>
                    Browse staff and roles grouped by department. Expand a department to see its members and
                    appointed HOD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search department, name, email, or staff ID…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOnlyMissingHod((v) => !v)}
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        showOnlyMissingHod
                          ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-800 dark:text-yellow-200"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {showOnlyMissingHod ? "Showing: no HOD only" : "Filter: departments without HOD"}
                    </button>
                  </div>

                  {filteredDepartments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No departments match your search or filter.
                    </p>
                  ) : (
                    <Accordion type="multiple" className="rounded-lg border px-4">
                      {filteredDepartments.map((dept) => (
                        <AccordionItem key={dept.departmentId} value={String(dept.departmentId)}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex min-w-0 flex-1 flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between sm:pr-4">
                              <span className="truncate font-medium">{dept.departmentName}</span>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="font-normal">
                                  {dept.staffCount} staff
                                </Badge>
                                {dept.hasHod ? (
                                  <Badge
                                    variant="default"
                                    className="bg-emerald-600 font-normal hover:bg-emerald-600/90 dark:bg-emerald-700"
                                  >
                                    HOD: {dept.hods[0].fullName}
                                    {dept.hods.length > 1 ? ` +${dept.hods.length - 1}` : ""}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-yellow-500/30 bg-yellow-500/15 font-normal text-yellow-700 dark:text-yellow-300"
                                  >
                                    <UserX className="mr-1 h-3 w-3" />
                                    No HOD assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {dept.staff.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No staff registered in this department.</p>
                            ) : (
                              <div className="rounded-lg border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[100px]">Staff ID</TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead className="hidden md:table-cell">Email</TableHead>
                                      <TableHead className="text-right">Role</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {dept.staff.map((member) => (
                                      <TableRow key={member.staffId}>
                                        <TableCell className="font-medium">{member.staffId}</TableCell>
                                        <TableCell>
                                          {member.fullName}
                                          <p className="text-sm text-muted-foreground md:hidden">{member.email}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                                        <TableCell className="text-right">
                                          <RoleBadge roleId={member.roleId} roleName={member.roleName} />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {!dept.hasHod ? (
                              <p className="mt-3 text-sm text-muted-foreground">
                                This department needs a Head of Department before HOD review workflows can run.
                              </p>
                            ) : null}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
