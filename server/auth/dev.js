import { attachSessionUser, findStaffByEmail } from "./microsoft.js";

export function isDevLoginEnabled() {
  if (process.env.DEV_LOGIN === "0") return false;
  if (process.env.DEV_LOGIN === "1") return true;
  return process.env.NODE_ENV !== "production";
}

function displayNameFromEmail(email) {
  const local = String(email ?? "").split("@")[0] ?? "";
  return local.replace(/[._-]+/g, " ").trim() || email;
}

export function registerDevAuthRoutes(apiRouter, { pool, dashboardPathForRole, loginLimiter }) {
  if (!isDevLoginEnabled()) {
    return;
  }

  apiRouter.get("/auth/dev/accounts", async (_req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT s.email, r.role_name
         FROM staff s
         INNER JOIN role_table r ON r.role_id = s.role_id
         ORDER BY s.email`,
      );

      return res.json({
        accounts: rows.map((row) => ({
          email: row.email,
          roleName: row.role_name,
        })),
      });
    } catch (err) {
      console.error("Dev accounts list error:", err);
      return res.status(500).json({ error: "Unable to load dev accounts." });
    }
  });

  apiRouter.post("/auth/dev/login", loginLimiter, async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    try {
      const row = await findStaffByEmail(pool, email);
      if (!row) {
        return res.status(403).json({
          error: "No CPD account for that email. Choose a registered staff account.",
        });
      }

      attachSessionUser(req, row, {
        authProvider: "dev",
        microsoftProfile: { name: displayNameFromEmail(row.email) },
      });

      const redirect = dashboardPathForRole(row.role_id);

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error (dev login):", saveErr);
          return res.status(500).json({ error: "Signed in but session failed. Try again." });
        }
        return res.json({ ok: true, redirect });
      });
    } catch (err) {
      console.error("Dev login error:", err);
      return res.status(500).json({ error: "Unable to sign in. Try again later." });
    }
  });
}
