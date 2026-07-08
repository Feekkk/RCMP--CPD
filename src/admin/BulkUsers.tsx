import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  Users as UsersIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { AdminSidebar } from "@/admin/Sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const DEFAULT_ROLE_ID = 1;
const DEFAULT_ROLE_NAME = "Staff";
const DEPARTMENT_PENDING_LABEL = "Assign later";

const USERS_LIST_PATHS = ["/api/users-by-department", "/api/admin/users-by-department"] as const;

type DepartmentOption = { departmentId: number; departmentName: string };

type UsersByDepartmentResponse = {
  departments: Array<{ departmentId: number; departmentName: string }>;
};

type ParsedRow = {
  line: number;
  empno: string;
  email: string;
  division: string;
  departmentInput: string;
  departmentId: number | null;
  departmentLabel: string;
  roleId: number;
  roleName: string;
  valid: boolean;
  issue?: string;
};

const TEMPLATE_CSV = `empno,email,department,division
EMP001,staff1@unikl.edu.my,INFORMATION TECH DEPT,Corporate Services
EMP002,staff2@unikl.edu.my,HUMAN CAPITAL DEPT,Human Capital
EMP003,staff3@unikl.edu.my,,`;

async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  for (const path of USERS_LIST_PATHS) {
    const res = await fetch(path);
    if (!res.ok) continue;
    const data = (await res.json()) as UsersByDepartmentResponse;
    return data.departments.map((department) => ({
      departmentId: department.departmentId,
      departmentName: department.departmentName,
    }));
  }
  return [];
}

function buildDepartmentLookup(departments: DepartmentOption[]) {
  const lookup = new Map<string, DepartmentOption>();
  for (const department of departments) {
    lookup.set(department.departmentName.trim().toLowerCase(), department);
  }
  return lookup;
}

function resolveDepartment(raw: string, lookup: Map<string, DepartmentOption>) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      departmentId: null,
      departmentLabel: DEPARTMENT_PENDING_LABEL,
    };
  }

  const match = lookup.get(trimmed.toLowerCase());
  if (!match) {
    return {
      departmentId: null,
      departmentLabel: trimmed,
      issue: `Unknown department: ${trimmed}`,
    };
  }

  return {
    departmentId: match.departmentId,
    departmentLabel: match.departmentName,
  };
}

function parseCsvLine(line: string) {
  return line.split(",").map((part) => part.trim());
}

function parseCsvPreview(text: string, lookup: Map<string, DepartmentOption>): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const empnoIdx = headers.indexOf("empno");
  const emailIdx = headers.indexOf("email");
  const departmentIdx = headers.indexOf("department");
  const divisionIdx = headers.indexOf("division");

  if (empnoIdx === -1 || emailIdx === -1) return [];

  return lines.slice(1).map((line, index) => {
    const columns = parseCsvLine(line);
    const empno = columns[empnoIdx] ?? "";
    const email = columns[emailIdx] ?? "";
    const division = divisionIdx === -1 ? "" : (columns[divisionIdx] ?? "");
    const departmentInput = departmentIdx === -1 ? "" : (columns[departmentIdx] ?? "");
    const department = resolveDepartment(departmentInput, lookup);

    const baseValid = empno.length > 0 && email.includes("@");
    const valid = baseValid && !department.issue;

    let issue: string | undefined;
    if (!empno.length || !email.includes("@")) {
      issue = "Missing empno or invalid email";
    } else if (department.issue) {
      issue = department.issue;
    }

    return {
      line: index + 2,
      empno,
      email,
      division,
      departmentInput,
      departmentId: department.departmentId,
      departmentLabel: department.departmentLabel,
      roleId: DEFAULT_ROLE_ID,
      roleName: DEFAULT_ROLE_NAME,
      valid,
      issue,
    };
  });
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "bulk-users-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function DepartmentCell({ row }: { row: ParsedRow }) {
  if (!row.valid && row.departmentInput) {
    return (
      <Badge variant="destructive" className="max-w-[220px] truncate font-normal" title={row.departmentLabel}>
        {row.departmentLabel}
      </Badge>
    );
  }

  if (row.departmentId == null) {
    return (
      <Badge variant="secondary" className="font-normal">
        Assign later
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="max-w-[220px] truncate font-normal" title={row.departmentLabel}>
      {row.departmentLabel}
    </Badge>
  );
}

function StatusCell({ row }: { row: ParsedRow }) {
  if (row.valid) {
    return (
      <Badge className="border-green-500/30 bg-green-500/10 font-normal text-green-700 hover:bg-green-500/10 dark:text-green-300">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Ready
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="max-w-[180px] truncate font-normal" title={row.issue}>
      <AlertCircle className="mr-1 h-3 w-3 shrink-0" />
      {row.issue ?? "Invalid"}
    </Badge>
  );
}

export function AdminBulkUsersPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewRows, setPreviewRows] = React.useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  const { data: departments = [], isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ["admin", "bulk-users", "departments"],
    queryFn: fetchDepartmentOptions,
  });

  const departmentLookup = React.useMemo(() => buildDepartmentLookup(departments), [departments]);

  const rows = previewRows;
  const validCount = rows.filter((row) => row.valid).length;
  const invalidCount = rows.length - validCount;
  const assignLaterCount = rows.filter((row) => row.valid && row.departmentId == null).length;
  const hasPreview = rows.length > 0;
  const canImport = hasPreview && invalidCount === 0 && !isImporting && !isParsing && !isDepartmentsLoading;

  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
      const text = await file.text();
      const parsed = parseCsvPreview(text, departmentLookup);
      setPreviewRows(parsed);
      if (!parsed.length) {
        toast.error("CSV must include empno and email columns with at least one data row.");
      }
    } catch {
      toast.error("Unable to read the selected file.");
      setPreviewRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);

    if (!file) {
      setPreviewRows([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      setPreviewRows([]);
      return;
    }

    if (departmentLookup.size === 0) {
      toast.error("Department list is not loaded yet. Try again in a moment.");
      return;
    }

    await parseFile(file);
  };

  const handleImport = async () => {
    if (!rows.length) {
      toast.error("Upload a CSV file before importing.");
      return;
    }

    if (invalidCount > 0) {
      toast.error("Fix invalid rows before importing.");
      return;
    }

    setIsImporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsImporting(false);

    const assignedCount = validCount - assignLaterCount;
    toast.success("Bulk import preview complete", {
      description: `${validCount} staff records ready (${assignedCount} with department, ${assignLaterCount} assign later). Role defaults to Staff (ID ${DEFAULT_ROLE_ID}). Backend integration is not connected yet.`,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <AdminSidebar />

      <div className="min-w-0 pt-14 md:pl-72 md:pt-0">
        <header className="sticky top-14 z-10 md:top-0 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Bulk add users</h1>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/admin/users">
                  <ArrowLeft className="h-4 w-4" />
                  Back to users
                </Link>
              </Button>
              <Button className="w-full sm:w-auto" disabled={!canImport} onClick={handleImport}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {validCount || 0} users
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto space-y-6 py-8">
          {hasPreview ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total rows</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{rows.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Valid</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-green-700 dark:text-green-300">{validCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Invalid</p>
                  <p
                    className={cn(
                      "mt-1 text-2xl font-bold tabular-nums",
                      invalidCount > 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {invalidCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Assign dept. later</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{assignLaterCount}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Upload CSV</CardTitle>
              <CardDescription>
                Upload a file with empno, email, and optional department and division. All imported users default to
                Staff (role_id {DEFAULT_ROLE_ID}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-4">
                  <label
                    htmlFor="bulk-users-csv"
                    className={cn(
                      "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
                      selectedFile ? "border-primary/40 bg-primary/5" : "bg-muted/20 hover:bg-muted/40",
                      (isDepartmentsLoading || departmentLookup.size === 0) && "pointer-events-none opacity-60",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isDepartmentsLoading
                          ? "Loading departments…"
                          : selectedFile
                            ? selectedFile.name
                            : "Drop CSV here or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground">CSV only · up to 500 rows</p>
                    </div>
                    <Input
                      id="bulk-users-csv"
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      disabled={isDepartmentsLoading || departmentLookup.size === 0}
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={downloadTemplate} disabled={isDepartmentsLoading}>
                      <Download className="h-4 w-4" />
                      Download template
                    </Button>
                    {selectedFile ? (
                      <Button type="button" variant="ghost" onClick={() => handleFileChange(null)}>
                        Clear file
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Required columns</p>
                  <div className="mt-3 rounded-lg border bg-background p-3 font-mono text-[11px] leading-5 text-muted-foreground">
                    empno,email,department,division
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">empno</span> — employee number or identifier
                    </li>
                    <li>
                      <span className="font-medium text-foreground">email</span> — Microsoft SSO email
                    </li>
                    <li>
                      <span className="font-medium text-foreground">department</span> — optional; matched by name
                    </li>
                    <li>
                      <span className="font-medium text-foreground">division</span> — optional free text
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <UsersIcon className="h-4 w-4" />
            <AlertTitle>Preview only</AlertTitle>
            <AlertDescription>
              Import does not write to the database yet. Use this page to validate your CSV before backend integration is
              connected.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {selectedFile
                    ? `Reviewing ${selectedFile.name}. Role defaults to ${DEFAULT_ROLE_NAME}.`
                    : "Upload a CSV to review rows before import."}
                </CardDescription>
              </div>
              {hasPreview ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{rows.length} rows</Badge>
                  <Badge className="border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-300">
                    {validCount} ready
                  </Badge>
                  {invalidCount > 0 ? <Badge variant="destructive">{invalidCount} issues</Badge> : null}
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              {isParsing || isDepartmentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isDepartmentsLoading ? "Loading departments…" : "Parsing CSV…"}
                </div>
              ) : hasPreview ? (
                <div className="rounded-lg border">
                  <ScrollArea className="h-[min(70vh,560px)]">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                        <TableRow>
                          <TableHead className="w-14">#</TableHead>
                          <TableHead className="min-w-[160px]">Empno</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[120px]">Division</TableHead>
                          <TableHead className="min-w-[180px]">Department</TableHead>
                          <TableHead className="min-w-[140px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={`${row.line}-${row.empno}-${row.email}`}>
                            <TableCell className="text-muted-foreground tabular-nums">{row.line}</TableCell>
                            <TableCell className="max-w-[220px] truncate font-medium" title={row.empno}>
                              {row.empno || "—"}
                            </TableCell>
                            <TableCell className="max-w-[260px] truncate" title={row.email}>
                              {row.email || "—"}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-muted-foreground" title={row.division}>
                              {row.division || "—"}
                            </TableCell>
                            <TableCell>
                              <DepartmentCell row={row} />
                            </TableCell>
                            <TableCell>
                              <StatusCell row={row} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-20 text-center">
                  <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/60" />
                  <p className="mt-4 font-medium">No preview yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a CSV file above to validate staff records before import.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
