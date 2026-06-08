import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Info,
  LayoutList,
  Loader2,
  Plus,
  Search,
  Users as UsersIcon,
  UserX,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { AdminSidebar } from "@/admin/Sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const USERS_QUERY_KEY = ["admin", "users-by-department"] as const;
const DEFAULT_PASSWORD = "RCMP1234";

type RoleOption = { roleId: number; roleName: string };

type StaffMember = {
  staffId: number;
  fullName: string;
  email: string;
  departmentId: number;
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
  roles: RoleOption[];
  departments: DepartmentGroup[];
  departmentsWithoutHod: Array<{ departmentId: number; departmentName: string }>;
  summary: {
    totalDepartments: number;
    totalStaff: number;
    departmentsWithoutHodCount: number;
  };
};

type FlatStaffRow = StaffMember & { departmentName: string };

type DepartmentOption = { departmentId: number; departmentName: string };

async function parseApiError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
  return [data.error, data.hint].filter(Boolean).join(" ") || fallback;
}

const USERS_LIST_PATHS = ["/api/users-by-department", "/api/admin/users-by-department"] as const;

async function checkApiBuild(): Promise<{ ok: boolean; apiBuild?: number; message?: string }> {
  try {
    const res = await fetch("/api/ping");
    const data = (await res.json().catch(() => ({}))) as {
      apiBuild?: number;
      features?: { usersByDepartment?: boolean; staffCrud?: boolean };
    };
    if (!res.ok) {
      return { ok: false, message: "Cannot reach /api/ping. Run npm run dev:full (not npm run dev alone)." };
    }
    if (data.apiBuild !== 3 || data.features?.staffCrud !== true) {
      return {
        ok: false,
        apiBuild: data.apiBuild,
        message:
          "Port 3001 is running an old API. Stop other Node processes, then run npm run dev:full. /api/ping must show apiBuild 3 and staffCrud true.",
      };
    }
    return { ok: true, apiBuild: data.apiBuild };
  } catch {
    return {
      ok: false,
      message:
        "Cannot reach the API on port 3001. Run npm run dev:full and use http://localhost:8080 (not :3001).",
    };
  }
}

async function fetchUsersByDepartment(): Promise<UsersByDepartmentResponse> {
  const buildCheck = await checkApiBuild();
  if (!buildCheck.ok) {
    throw new Error(buildCheck.message ?? "API not ready.");
  }

  let lastError = "Unable to load users.";

  for (const path of USERS_LIST_PATHS) {
    const res = await fetch(path);
    const data = (await res.json().catch(() => ({}))) as UsersByDepartmentResponse & {
      error?: string;
      hint?: string;
    };
    if (res.ok) {
      return data;
    }
    lastError = [data.error, data.hint].filter(Boolean).join(" ") || lastError;
    if (res.status !== 404) {
      throw new Error(lastError);
    }
  }

  throw new Error(
    `${lastError} Stop any old Node on port 3001, run npm run dev:full, open http://localhost:8080/api/ping — expect apiBuild 3.`,
  );
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) {
    throw new Error(await parseApiError(res, `Request failed (${res.status}).`));
  }
  return res;
}

function sortDepartments(depts: DepartmentGroup[]) {
  return [...depts].sort((a, b) => {
    if (a.hasHod !== b.hasHod) return a.hasHod ? 1 : -1;
    return a.departmentName.localeCompare(b.departmentName);
  });
}

function DepartmentSelect({
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  value: number;
  options: DepartmentOption[];
  onChange: (id: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-8 text-xs", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[min(50vh,280px)]">
        {options.map((d) => (
          <SelectItem key={d.departmentId} value={String(d.departmentId)} className="text-xs">
            <span className="line-clamp-2">{d.departmentName}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RoleSelect({
  value,
  roles,
  onChange,
  disabled,
  className,
}: {
  value: number;
  roles: RoleOption[];
  onChange: (id: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
      <SelectTrigger className={cn("h-8 text-xs", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.roleId} value={String(r.roleId)} className="text-xs">
            {r.roleName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StaffTable({
  rows,
  showDepartment,
  departmentOptions,
  roles,
  onUpdateStaff,
  updatingStaffId,
}: {
  rows: FlatStaffRow[] | StaffMember[];
  showDepartment?: boolean;
  departmentOptions: DepartmentOption[];
  roles: RoleOption[];
  onUpdateStaff: (staffId: number, patch: { roleId?: number; departmentId?: number }) => void;
  updatingStaffId: number | null;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No staff to display.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[90px]">Staff ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="min-w-[140px]">Department</TableHead>
          <TableHead className="min-w-[130px] text-right">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((member) => {
          const isUpdating = updatingStaffId === member.staffId;
          const deptId = member.departmentId;
          const deptName =
            showDepartment && "departmentName" in member
              ? (member as FlatStaffRow).departmentName
              : departmentOptions.find((d) => d.departmentId === deptId)?.departmentName;

          return (
            <TableRow key={showDepartment ? `${deptId}-${member.staffId}` : member.staffId}>
              <TableCell className="font-medium">{member.staffId}</TableCell>
              <TableCell>
                {member.fullName}
                <p className="text-sm text-muted-foreground md:hidden">{member.email}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">{member.email}</TableCell>
              <TableCell>
                <DepartmentSelect
                  value={deptId}
                  options={departmentOptions}
                  disabled={isUpdating}
                  onChange={(id) => {
                    if (id !== deptId) onUpdateStaff(member.staffId, { departmentId: id });
                  }}
                />
                {showDepartment && deptName ? (
                  <p className="mt-1 text-xs text-muted-foreground lg:hidden">{deptName}</p>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <RoleSelect
                  value={member.roleId}
                  roles={roles}
                  disabled={isUpdating}
                  className="ml-auto w-full max-w-[160px]"
                  onChange={(id) => {
                    if (id !== member.roleId) onUpdateStaff(member.staffId, { roleId: id });
                  }}
                />
                {isUpdating ? (
                  <Loader2 className="ml-auto mt-1 h-3 w-3 animate-spin text-muted-foreground" />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DepartmentListButton({
  dept,
  isSelected,
  onSelect,
}: {
  dept: DepartmentGroup;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        isSelected
          ? "border-primary/40 bg-accent text-foreground"
          : "border-transparent hover:border-border hover:bg-accent/60",
      )}
    >
      <span className="line-clamp-2 font-medium leading-snug">{dept.departmentName}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="h-5 px-1.5 text-xs font-normal">
          {dept.staffCount}
        </Badge>
        {dept.hasHod ? (
          <span className="truncate text-xs text-muted-foreground">HOD: {dept.hods[0].fullName}</span>
        ) : (
          <Badge
            variant="outline"
            className="h-5 border-yellow-500/30 bg-yellow-500/15 px-1.5 text-xs font-normal text-yellow-700 dark:text-yellow-300"
          >
            No HOD
          </Badge>
        )}
      </div>
    </button>
  );
}

type AddUserFormState = {
  staffId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  roleId: string;
  password: string;
};

const emptyAddForm = (defaultDeptId?: number): AddUserFormState => ({
  staffId: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  departmentId: defaultDeptId != null ? String(defaultDeptId) : "",
  roleId: "1",
  password: "",
});

function AddUserDialog({
  open,
  onOpenChange,
  departmentOptions,
  roles,
  defaultDepartmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentOptions: DepartmentOption[];
  roles: RoleOption[];
  defaultDepartmentId?: number | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<AddUserFormState>(() => emptyAddForm(defaultDepartmentId ?? undefined));

  React.useEffect(() => {
    if (open) {
      setForm(emptyAddForm(defaultDepartmentId ?? undefined));
    }
  }, [open, defaultDepartmentId]);

  const createMutation = useMutation({
    mutationFn: async (payload: AddUserFormState) => {
      const body: Record<string, unknown> = {
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        departmentId: Number(payload.departmentId),
        roleId: Number(payload.roleId),
      };
      if (payload.staffId.trim()) body.staffId = Number(payload.staffId.trim());
      if (payload.password.trim()) body.password = payload.password.trim();

      const res = await apiFetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ staffId: number; message?: string }>;
    },
    onSuccess: (result) => {
      toast.success(result.message ?? "User added", {
        description: `Staff ID ${result.staffId}. Default password: ${DEFAULT_PASSWORD} (unless you set another).`,
      });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      toast.error("Please fill in name, email, and phone number.");
      return;
    }
    if (!form.departmentId || !form.roleId) {
      toast.error("Please select department and role.");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add user</DialogTitle>
          <DialogDescription>
            Create a staff account for the CPD portal. Leave Staff ID blank to auto-generate. Initial password
            defaults to {DEFAULT_PASSWORD} unless you set one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="add-staff-id">Staff ID (optional)</Label>
            <Input
              id="add-staff-id"
              inputMode="numeric"
              placeholder="Auto-generated if empty"
              value={form.staffId}
              onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-full-name">Full name</Label>
            <Input
              id="add-full-name"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              required
              placeholder="name@unikl.edu.my"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-phone">Phone number</Label>
            <Input
              id="add-phone"
              required
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Select
              value={form.departmentId}
              onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(50vh,280px)]">
                {departmentOptions.map((d) => (
                  <SelectItem key={d.departmentId} value={String(d.departmentId)}>
                    {d.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.roleId} value={String(r.roleId)}>
                    {r.roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-password">Initial password (optional)</Label>
            <Input
              id="add-password"
              type="password"
              placeholder={DEFAULT_PASSWORD}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Add user"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [showOnlyMissingHod, setShowOnlyMissingHod] = React.useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<"browse" | "results">("browse");
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [updatingStaffId, setUpdatingStaffId] = React.useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsersByDepartment,
  });

  const departmentOptions = React.useMemo((): DepartmentOption[] => {
    if (!data?.departments) return [];
    return data.departments.map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
    }));
  }, [data?.departments]);

  const roles = data?.roles ?? [];

  const updateStaffMutation = useMutation({
    mutationFn: async ({
      staffId,
      roleId,
      departmentId,
    }: {
      staffId: number;
      roleId?: number;
      departmentId?: number;
    }) => {
      const res = await apiFetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, departmentId }),
      });
      return res.json() as Promise<{ fullName: string; message?: string }>;
    },
    onMutate: ({ staffId }) => setUpdatingStaffId(staffId),
    onSuccess: (result) => {
      toast.success(result.message ?? "Updated", {
        description: result.fullName,
      });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setUpdatingStaffId(null),
  });

  const handleUpdateStaff = (staffId: number, patch: { roleId?: number; departmentId?: number }) => {
    updateStaffMutation.mutate({ staffId, ...patch });
  };

  const searchLower = search.trim().toLowerCase();
  const isSearchActive = searchLower.length > 0;

  const filteredDepartments = React.useMemo(() => {
    if (!data?.departments) return [];
    const matched = data.departments.filter((dept) => {
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
    return sortDepartments(matched);
  }, [data?.departments, searchLower, showOnlyMissingHod]);

  const searchResultRows = React.useMemo((): FlatStaffRow[] => {
    if (!isSearchActive) return [];
    const rows: FlatStaffRow[] = [];
    for (const dept of filteredDepartments) {
      for (const member of dept.staff) {
        const matchesDept = dept.departmentName.toLowerCase().includes(searchLower);
        const matchesMember =
          member.fullName.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          String(member.staffId).includes(searchLower);
        if (matchesDept || matchesMember) {
          rows.push({
            ...member,
            departmentName: dept.departmentName,
          });
        }
      }
    }
    return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [filteredDepartments, isSearchActive, searchLower]);

  const selectedDepartment = React.useMemo(
    () => filteredDepartments.find((d) => d.departmentId === selectedDepartmentId) ?? null,
    [filteredDepartments, selectedDepartmentId],
  );

  React.useEffect(() => {
    if (filteredDepartments.length === 0) {
      setSelectedDepartmentId(null);
      return;
    }
    const stillValid = filteredDepartments.some((d) => d.departmentId === selectedDepartmentId);
    if (!stillValid) {
      setSelectedDepartmentId(filteredDepartments[0].departmentId);
    }
  }, [filteredDepartments, selectedDepartmentId]);

  React.useEffect(() => {
    if (isSearchActive && searchResultRows.length > 0) {
      setActiveTab("results");
    } else if (!isSearchActive) {
      setActiveTab("browse");
    }
  }, [isSearchActive, searchResultRows.length]);

  const missingHod = data?.departmentsWithoutHod ?? [];

  const selectDepartment = (id: number) => {
    setSelectedDepartmentId(id);
    setActiveTab("browse");
  };

  const tableEditProps = {
    departmentOptions,
    roles,
    onUpdateStaff: handleUpdateStaff,
    updatingStaffId,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Users</h1>
              </div>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!data}
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add user
            </Button>
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
              <AddUserDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                departmentOptions={departmentOptions}
                roles={roles}
                defaultDepartmentId={selectedDepartmentId}
              />

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

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Staff directory</CardTitle>
                  <CardDescription>
                    Change role or department from the dropdowns in each row — updates save automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search department, name, email, or staff ID…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant={showOnlyMissingHod ? "default" : "outline"}
                      className={cn(
                        showOnlyMissingHod &&
                          "bg-yellow-600 hover:bg-yellow-600/90 dark:bg-yellow-700 dark:hover:bg-yellow-700/90",
                      )}
                      onClick={() => setShowOnlyMissingHod((v) => !v)}
                    >
                      <UserX className="h-4 w-4" />
                      {showOnlyMissingHod ? "No HOD only" : "Without HOD"}
                    </Button>
                  </div>

                  {filteredDepartments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No departments match your search or filter.
                    </p>
                  ) : (
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as "browse" | "results")}
                      className="grid gap-4"
                    >
                      <TabsList className="w-full justify-start sm:w-auto">
                        <TabsTrigger value="browse" className="gap-2">
                          <Building2 className="h-4 w-4" />
                          By department
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {filteredDepartments.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="results" className="gap-2" disabled={!isSearchActive}>
                          <LayoutList className="h-4 w-4" />
                          Search results
                          {isSearchActive ? (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                              {searchResultRows.length}
                            </Badge>
                          ) : null}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="browse" className="mt-0">
                        <div className="lg:hidden">
                          <Select
                            value={selectedDepartmentId != null ? String(selectedDepartmentId) : undefined}
                            onValueChange={(v) => setSelectedDepartmentId(Number(v))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[min(60vh,320px)]">
                              {filteredDepartments.map((dept) => (
                                <SelectItem key={dept.departmentId} value={String(dept.departmentId)}>
                                  <span className="line-clamp-1">
                                    {dept.departmentName}
                                    {!dept.hasHod ? " · No HOD" : ""} ({dept.staffCount})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start">
                          <div className="hidden rounded-lg border lg:block">
                            <div className="border-b px-3 py-2">
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Departments
                              </p>
                              <p className="text-xs text-muted-foreground">Departments without HOD appear first</p>
                            </div>
                            <ScrollArea className="h-[min(58vh,520px)]">
                              <div className="space-y-1 p-2">
                                {filteredDepartments.map((dept) => (
                                  <DepartmentListButton
                                    key={dept.departmentId}
                                    dept={dept}
                                    isSelected={dept.departmentId === selectedDepartmentId}
                                    onSelect={() => selectDepartment(dept.departmentId)}
                                  />
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          <div className="min-w-0 rounded-lg border">
                            {selectedDepartment ? (
                              <>
                                <div className="border-b px-4 py-3">
                                  <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">
                                    {selectedDepartment.departmentName}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{selectedDepartment.staffCount} staff</Badge>
                                    {selectedDepartment.hasHod ? (
                                      <Badge className="bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-700">
                                        HOD: {selectedDepartment.hods.map((h) => h.fullName).join(", ")}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                                      >
                                        <UserX className="mr-1 h-3 w-3" />
                                        No HOD assigned
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <ScrollArea className="h-[min(50vh,440px)]">
                                  <div className="p-2">
                                    <StaffTable rows={selectedDepartment.staff} {...tableEditProps} />
                                  </div>
                                </ScrollArea>
                              </>
                            ) : (
                              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                                Select a department to view staff.
                              </p>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="results" className="mt-0">
                        <p className="mb-3 text-sm text-muted-foreground">
                          Showing {searchResultRows.length} staff matching &ldquo;{search.trim()}&rdquo;. Edit role or
                          department inline.
                        </p>
                        <div className="rounded-lg border">
                          <ScrollArea className="h-[min(58vh,520px)]">
                            <div className="p-2">
                              <StaffTable rows={searchResultRows} showDepartment {...tableEditProps} />
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                    </Tabs>
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
