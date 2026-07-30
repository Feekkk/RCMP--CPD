import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  UserPlus,
  Users as UsersIcon,
  UserX,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { AdminSidebar } from "@/admin/Sidebar";
import { InsightStatCard } from "@/components/cpd/InsightStatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const USERS_QUERY_KEY = ["admin", "users-by-department"] as const;

type RoleOption = { roleId: number; roleName: string };

type StaffMember = {
  staffId: number;
  fullName: string;
  email: string;
  empno?: string | null;
  division?: string | null;
  departmentId: number | null;
  roleId: number;
  roleName: string;
  isIncomplete?: boolean;
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
  incompleteStaff?: StaffMember[];
  summary: {
    totalDepartments: number;
    totalStaff: number;
    departmentsWithoutHodCount: number;
    incompleteStaffCount?: number;
  };
};

type FlatStaffRow = StaffMember & { departmentName: string };

type DepartmentOption = { departmentId: number; departmentName: string };

async function parseApiError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
  return [data.error, data.hint].filter(Boolean).join(" ") || fallback;
}

const USERS_LIST_PATHS = ["/api/users-by-department", "/api/admin/users-by-department"] as const;

const MIN_USERS_API_BUILD = 7;

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

    const apiBuild = data.apiBuild ?? 0;
    const hasStaffCrud = data.features?.staffCrud === true;
    const hasUsersByDepartment = data.features?.usersByDepartment === true;

    if (apiBuild < MIN_USERS_API_BUILD || !hasStaffCrud || !hasUsersByDepartment) {
      return {
        ok: false,
        apiBuild,
        message:
          apiBuild < MIN_USERS_API_BUILD
            ? `Port 3001 is running an old API (apiBuild ${apiBuild}). Stop other Node processes, then run npm run dev:full. /api/ping must show apiBuild ${MIN_USERS_API_BUILD}+ with staffCrud true.`
            : "User management API is unavailable. Restart with npm run dev:full and confirm /api/ping shows staffCrud and usersByDepartment true.",
      };
    }

    return { ok: true, apiBuild };
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
    `${lastError} Stop any old Node on port 3001, run npm run dev:full, open http://localhost:8080/api/ping — expect apiBuild ${MIN_USERS_API_BUILD}+ with staffCrud true.`,
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
  placeholder = "Select department",
}: {
  value: number | null;
  options: DepartmentOption[];
  onChange: (id: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-9", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[min(50vh,280px)]">
        {options.map((d) => (
          <SelectItem key={d.departmentId} value={String(d.departmentId)}>
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
      <SelectTrigger className={cn("h-9", className)}>
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
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function StaffMemberList({
  rows,
  showDepartment,
  departmentOptions,
  roles,
  onUpdateStaff,
  updatingStaffId,
  emptyMessage = "No staff in this department yet.",
}: {
  rows: FlatStaffRow[] | StaffMember[];
  showDepartment?: boolean;
  departmentOptions: DepartmentOption[];
  roles: RoleOption[];
  onUpdateStaff: (staffId: number, patch: { roleId?: number; departmentId?: number }) => void;
  updatingStaffId: number | null;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UsersIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Use Add user above to register someone, or search another department.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-3 sm:p-4">
      {rows.map((member) => {
        const isUpdating = updatingStaffId === member.staffId;
        const deptId = member.departmentId;
        const needsDepartment = member.isIncomplete || deptId == null;

        return (
          <div
            key={showDepartment ? `${deptId ?? "x"}-${member.staffId}` : member.staffId}
            className={cn(
              "rounded-2xl border bg-card p-4 transition-colors",
              needsDepartment && "border-yellow-500/40 bg-yellow-500/5",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 border border-border">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initialsFromName(member.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium leading-tight">{member.fullName}</p>
                  {needsDepartment ? (
                    <Badge
                      variant="outline"
                      className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                    >
                      Needs department
                    </Badge>
                  ) : null}
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{member.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Staff ID {member.staffId}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <DepartmentSelect
                  value={deptId}
                  options={departmentOptions}
                  disabled={isUpdating}
                  placeholder={needsDepartment ? "Assign department…" : undefined}
                  onChange={(id) => {
                    if (id !== deptId) onUpdateStaff(member.staffId, { departmentId: id });
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <RoleSelect
                  value={member.roleId}
                  roles={roles}
                  disabled={isUpdating}
                  onChange={(id) => {
                    if (id !== member.roleId) onUpdateStaff(member.staffId, { roleId: id });
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          dept.hasHod ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        )}
      >
        {dept.hasHod ? <CheckCircle2 className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium leading-snug">{dept.departmentName}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
            {dept.staffCount} staff
          </Badge>
          {dept.hasHod ? (
            <span className="truncate text-xs text-muted-foreground">HOD: {dept.hods[0].fullName}</span>
          ) : (
            <Badge
              variant="outline"
              className="h-5 border-yellow-500/30 bg-yellow-500/15 px-1.5 text-[10px] font-normal text-yellow-700 dark:text-yellow-300"
            >
              No HOD
            </Badge>
          )}
        </span>
      </span>
    </button>
  );
}

type AddUserFormState = {
  email: string;
  departmentId: string;
  roleId: string;
};

const emptyAddForm = (defaultDeptId?: number): AddUserFormState => ({
  email: "",
  departmentId: defaultDeptId != null ? String(defaultDeptId) : "",
  roleId: "1",
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
      const body = {
        email: payload.email.trim(),
        departmentId: Number(payload.departmentId),
        roleId: Number(payload.roleId),
      };

      const res = await apiFetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ staffId: number; message?: string }>;
    },
    onSuccess: (result) => {
      toast.success(result.message ?? "User added", {
        description: `Staff ID ${result.staffId}. They can sign in with Microsoft SSO.`,
      });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Please enter an email address.");
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
            Register a staff email for the CPD portal. They sign in with Microsoft SSO using that address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
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
  const [showIncomplete, setShowIncomplete] = React.useState(false);
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

  const incompleteStaff = data?.incompleteStaff ?? [];
  const incompleteCount = data?.summary.incompleteStaffCount ?? incompleteStaff.length;

  const incompleteRows = React.useMemo((): FlatStaffRow[] => {
    return incompleteStaff
      .map((member) => ({
        ...member,
        departmentName: "Unassigned",
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [incompleteStaff]);

  const selectDepartment = (id: number) => {
    setSelectedDepartmentId(id);
    setShowIncomplete(false);
    setActiveTab("browse");
  };

  const openIncompleteStaff = () => {
    setShowIncomplete(true);
    setShowOnlyMissingHod(false);
    setSearch("");
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

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Manage Staff</h1>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" className="w-full sm:w-auto" disabled={!data}>
                  <Plus className="h-4 w-4" />
                  Add user
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setAddDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add user
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/users/bulk" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Add bulk
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <InsightStatCard
                  title="Total staff"
                  value={data.summary.totalStaff}
                  description="All staff accounts in the system"
                  icon={UsersIcon}
                  featured
                />
                <InsightStatCard
                  title="Departments"
                  value={data.summary.totalDepartments}
                  description="Active departments with staff records"
                  icon={Building2}
                />
                <InsightStatCard
                  title="Incomplete details"
                  value={incompleteCount}
                  description="Click to assign departments for incomplete staff"
                  icon={UserX}
                  className={cn(
                    "cursor-pointer",
                    showIncomplete && "border-yellow-500/50 bg-yellow-500/5 ring-2 ring-yellow-500/20",
                    incompleteCount > 0 && !showIncomplete && "border-yellow-500/30",
                  )}
                  valueClassName={incompleteCount > 0 ? "text-yellow-700 dark:text-yellow-300" : undefined}
                  iconClassName={
                    incompleteCount > 0
                      ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                      : undefined
                  }
                  onClick={openIncompleteStaff}
                />
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Staff directory</CardTitle>
                  <CardDescription>
                    Pick a department on the left, then update each person&apos;s role or department below. Changes save
                    automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {showIncomplete ? (
                    <div className="grid gap-4">
                      <div className="flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">Staff missing department</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Assign a department for each person. They leave this list once updated.
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setShowIncomplete(false)}>
                          Back to directory
                        </Button>
                      </div>
                      <div className="rounded-2xl border bg-muted/10">
                        <ScrollArea className="h-[min(58vh,560px)]">
                          <StaffMemberList
                            rows={incompleteRows}
                            showDepartment
                            emptyMessage="No incomplete staff accounts."
                            {...tableEditProps}
                          />
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by department, name, email, or staff ID…"
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
                          {showOnlyMissingHod ? "Showing: No HOD" : "Without HOD"}
                        </Button>
                      </div>

                      {filteredDepartments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed px-4 py-12 text-center">
                          <p className="text-sm font-medium">No departments match</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Try another search, or turn off the Without HOD filter.
                          </p>
                        </div>
                      ) : (
                        <Tabs
                          value={activeTab}
                          onValueChange={(v) => setActiveTab(v as "browse" | "results")}
                          className="grid gap-4"
                        >
                          <TabsContent value="browse" className="mt-0">
                            <div className="lg:hidden">
                              <Label className="mb-1.5 block text-xs text-muted-foreground">Department</Label>
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

                            <div className="grid gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start">
                              <div className="hidden overflow-hidden rounded-2xl border lg:block">
                                <div className="border-b bg-muted/30 px-4 py-3">
                                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Departments
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    Departments without HOD are listed first
                                  </p>
                                </div>
                                <ScrollArea className="h-[min(58vh,560px)]">
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

                              <div className="min-w-0 overflow-hidden rounded-2xl border">
                                {selectedDepartment ? (
                                  <>
                                    <div className="border-b bg-muted/20 px-4 py-4">
                                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Selected department
                                      </p>
                                      <h3 className="mt-1 font-display text-xl font-semibold leading-snug tracking-tight">
                                        {selectedDepartment.departmentName}
                                      </h3>
                                      <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{selectedDepartment.staffCount} staff</Badge>
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
                                    <ScrollArea className="h-[min(50vh,480px)]">
                                      <StaffMemberList
                                        rows={selectedDepartment.staff}
                                        emptyMessage="No staff in this department yet."
                                        {...tableEditProps}
                                      />
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
                            <div className="mb-3 rounded-xl border bg-muted/20 px-4 py-3">
                              <p className="text-sm font-medium">
                                {searchResultRows.length} staff found for &ldquo;{search.trim()}&rdquo;
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Update role or department on each card — changes save automatically.
                              </p>
                            </div>
                            <div className="rounded-2xl border bg-muted/10">
                              <ScrollArea className="h-[min(58vh,560px)]">
                                <StaffMemberList
                                  rows={searchResultRows}
                                  showDepartment
                                  emptyMessage="No staff match this search."
                                  {...tableEditProps}
                                />
                              </ScrollArea>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </>
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
