export const ROLE = {
  STAFF: 1,
  ADMIN: 2,
  HOD: 3,
  APPROVAL: 4,
} as const;

export type RoleId = (typeof ROLE)[keyof typeof ROLE];

export type DevAccount = {
  email: string;
  roleName: string;
};

export type SessionUser = {
  staffId: number;
  fullName: string | null;
  email: string;
  entraId: string | null;
  departmentId: number;
  departmentName: string;
  roleId: number;
  roleName: string;
  authProvider: string;
  redirect: string;
};

export function dashboardPathForRole(roleId: number) {
  switch (roleId) {
    case ROLE.STAFF:
      return "/staff/dashboard";
    case ROLE.ADMIN:
      return "/admin/dashboard";
    case ROLE.HOD:
      return "/hod/dashboard";
    case ROLE.APPROVAL:
      return "/approval/dashboard";
    default:
      return "/staff/dashboard";
  }
}

async function parseApiError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || fallback;
}

export async function fetchDevAccounts(): Promise<DevAccount[]> {
  const res = await fetch("/api/auth/dev/accounts", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Dev accounts are unavailable."));
  }

  const data = (await res.json()) as { accounts: DevAccount[] };
  return data.accounts;
}

export async function devLogin(email: string): Promise<{ redirect: string }> {
  const res = await fetch("/api/auth/dev/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, `Sign-in failed (${res.status}).`));
  }

  return res.json() as Promise<{ ok: true; redirect: string }>;
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load session."));
  }

  return res.json() as Promise<SessionUser>;
}

export async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Could not sign out."));
  }
}
