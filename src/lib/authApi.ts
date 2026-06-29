export type DevAccount = {
  email: string;
  roleName: string;
};

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
