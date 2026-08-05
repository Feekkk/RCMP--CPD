import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createSessionMiddleware } from "./auth/session.js";
import { isDevLoginEnabled, registerDevAuthRoutes } from "./auth/dev.js";
import { isMicrosoftSsoConfigured, registerMicrosoftAuthRoutes } from "./auth/microsoft.js";
import { registerRequisitionRoutes } from "./requisitions.js";
import { scheduleAttachmentCleanup } from "../script/attachment-cleanup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");
const serveStatic = process.env.SERVE_STATIC !== "0" && fs.existsSync(distPath);

const app = express();
const apiRouter = express.Router();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const host = process.env.HOST || "0.0.0.0";

// Local dev: leave unset or TRUST_PROXY=0. Production behind nginx/Plesk: TRUST_PROXY=1
app.set("trust proxy", process.env.TRUST_PROXY === "1");
app.use(createSessionMiddleware());
app.use(express.json({ limit: "512kb" }));

app.use(
  helmet({
    // CSP is tuned for Vite builds; disable here if the panel serves static files separately
    contentSecurityPolicy: process.env.HELMET_CSP === "1",
    crossOriginEmbedderPolicy: false,
  }),
);

const rateLimitValidate = {
  trustProxy: process.env.TRUST_PROXY === "1",
  ...(process.env.RATE_LIMIT_VALIDATE_XFF === "0" ? { xForwardedForHeader: false } : {}),
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: rateLimitValidate,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: rateLimitValidate,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfter = Math.ceil(resetTime ? (resetTime - Date.now()) / 1000 : 15 * 60);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
    });
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "cpd",
  waitForConnections: true,
  connectionLimit: 10,
});

const STAFF_ROLE_ID = 1;
const HOD_ROLE_ID = 3;
const APPROVAL_ROLE_ID = 4;
const BULK_STAFF_MAX = 500;
/** Bump when API surface changes — exposed on /api/ping for deploy checks */
const API_BUILD = 13;

function dashboardPathForRole(roleId) {
  switch (roleId) {
    case 1:
      return "/staff/dashboard";
    case 2:
      return "/admin/dashboard";
    case 3:
      return "/hod/dashboard";
    case APPROVAL_ROLE_ID:
      return "/approval/dashboard";
    default:
      return "/staff/dashboard";
  }
}

function mapLoginDbError(err) {
  const code = err?.code;
  const message = String(err?.message ?? "");

  if (code === "ER_BAD_FIELD_ERROR" && message.includes("entra_id")) {
    return {
      status: 503,
      error: "Database staff table is outdated. Import db/schema.sql (id, email, entra_id columns).",
    };
  }
  if (
    code === "ER_NO_SUCH_TABLE" &&
    (message.includes("staff") ||
      message.includes("role_table") ||
      message.includes("department_table"))
  ) {
    return {
      status: 503,
      error: "Database tables are missing. Import db/schema.sql into the cpd database.",
    };
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ER_ACCESS_DENIED_ERROR") {
    return {
      status: 503,
      error: "Database connection failed. Check DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in the server environment.",
    };
  }

  return { status: 500, error: "Unable to sign in. Try again later." };
}

function mapStaffDbError(err) {
  const code = err?.code;
  const message = String(err?.message ?? "");

  if (code === "ER_DUP_ENTRY") {
    return { status: 409, error: "Staff ID or email already exists." };
  }
  if (code === "ER_NO_REFERENCES_ROW_2" || code === "ER_NO_REFERENCES_ROW") {
    return { status: 400, error: "Invalid role or department." };
  }

  const mapped = mapLoginDbError(err);
  return { status: mapped.status, error: mapped.error };
}

function parsePositiveInt(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const n = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function displayNameFromEmail(email) {
  const local = String(email ?? "").split("@")[0] ?? "";
  return local.replace(/[._-]+/g, " ").trim() || email;
}

async function fetchRoles() {
  const [rows] = await pool.execute(
    `SELECT role_id, role_name FROM role_table ORDER BY role_id`,
  );
  return rows.map((r) => ({ roleId: r.role_id, roleName: r.role_name }));
}

apiRouter.get("/ping", (_req, res) => {
  res.json({
    ok: true,
    service: "api",
    apiBuild: API_BUILD,
    uptime: Math.floor(process.uptime()),
    features: {
      usersByDepartment: true,
      staffCrud: true,
      staffBulk: true,
      requisitions: true,
      microsoftSso: isMicrosoftSsoConfigured(),
      devLogin: isDevLoginEnabled(),
    },
    authRoutes: [
      "/api/auth/microsoft",
      "/api/auth/microsoft/callback",
      "/api/auth/entra/profile",
      "/api/auth/me",
      ...(isDevLoginEnabled() ? ["/api/auth/dev/accounts", "/api/auth/dev/login"] : []),
    ],
  });
});

registerMicrosoftAuthRoutes(apiRouter, { pool, dashboardPathForRole, loginLimiter });
registerDevAuthRoutes(apiRouter, { pool, dashboardPathForRole, loginLimiter });
registerRequisitionRoutes(apiRouter, { pool, generalLimiter });

async function handleUsersByDepartment(_req, res) {
  try {
    const [deptRows] = await pool.execute(
      `SELECT department_id, department_name
       FROM department_table
       ORDER BY department_name`,
    );

    const [staffRows] = await pool.execute(
      `SELECT s.id, s.entra_id, s.empno, s.JG, s.email, s.department_id, s.division, s.role_id, r.role_name
       FROM staff s
       INNER JOIN role_table r ON r.role_id = s.role_id
       ORDER BY s.email`,
    );

    const staffByDept = new Map();
    const incompleteStaff = [];
    for (const row of staffRows) {
      const empno = row.empno == null ? "" : String(row.empno).trim();
      const jg = row.JG == null ? "" : String(row.JG).trim();
      const division = row.division == null ? "" : String(row.division).trim();
      const isIncomplete = row.department_id == null;
      const member = {
        staffId: row.id,
        fullName: displayNameFromEmail(row.email),
        email: row.email,
        empno: empno || null,
        jg: jg || null,
        division: division || null,
        entraId: row.entra_id,
        departmentId: row.department_id,
        roleId: row.role_id,
        roleName: row.role_name,
        isIncomplete,
      };

      if (isIncomplete) {
        incompleteStaff.push(member);
        continue;
      }

      const deptId = row.department_id;
      if (!staffByDept.has(deptId)) staffByDept.set(deptId, []);
      staffByDept.get(deptId).push(member);
    }

    const departments = deptRows.map((d) => {
      const staff = staffByDept.get(d.department_id) ?? [];
      const hods = staff.filter((s) => s.roleId === HOD_ROLE_ID);
      return {
        departmentId: d.department_id,
        departmentName: d.department_name,
        staffCount: staff.length,
        hasHod: hods.length > 0,
        hods: hods.map(({ staffId, fullName, email }) => ({ staffId, fullName, email })),
        staff,
      };
    });

    const departmentsWithoutHod = departments
      .filter((d) => !d.hasHod)
      .map((d) => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
      }));

    const roles = await fetchRoles();

    return res.json({
      roles,
      departments,
      departmentsWithoutHod,
      incompleteStaff,
      summary: {
        totalDepartments: departments.length,
        totalStaff: staffRows.length,
        departmentsWithoutHodCount: departmentsWithoutHod.length,
        incompleteStaffCount: incompleteStaff.length,
      },
    });
  } catch (err) {
    console.error("Users-by-department error:", err);
    const mapped = mapLoginDbError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
}

apiRouter.post("/staff", generalLimiter, async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const empno = String(req.body?.empno ?? "").trim() || null;
  const jg = String(req.body?.jg ?? "").trim() || null;
  const division = String(req.body?.division ?? "").trim() || null;
  const departmentId = parsePositiveInt(req.body?.departmentId);
  const roleId = parsePositiveInt(req.body?.roleId);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email is required." });
  }
  if (!departmentId || !roleId) {
    return res.status(400).json({ error: "Department and role are required." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO staff (empno, JG, email, department_id, division, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [empno, jg, email, departmentId, division, roleId],
    );

    return res.status(201).json({
      staffId: result.insertId,
      message: "Staff account created. User can sign in with Microsoft SSO.",
    });
  } catch (err) {
    console.error("Create staff error:", err);
    const mapped = mapStaffDbError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

apiRouter.post("/staff/bulk", generalLimiter, async (req, res) => {
  const users = Array.isArray(req.body?.users) ? req.body.users : null;
  if (!users) {
    return res.status(400).json({ error: "users array is required." });
  }
  if (users.length === 0) {
    return res.status(400).json({ error: "No users to import." });
  }
  if (users.length > BULK_STAFF_MAX) {
    return res.status(400).json({ error: `Maximum ${BULK_STAFF_MAX} users per import.` });
  }

  try {
    const [deptRows] = await pool.execute(`SELECT department_id FROM department_table`);
    const validDeptIds = new Set(deptRows.map((row) => row.department_id));

    const results = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let pendingDepartment = 0;
    const seenEmails = new Set();

    for (let index = 0; index < users.length; index += 1) {
      const row = users[index] ?? {};
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      const empno = String(row.empno ?? "").trim();
      const jg = String(row.jg ?? "").trim() || null;
      const division = String(row.division ?? "").trim() || null;
      const rawDepartmentId = row.departmentId;
      const departmentId =
        rawDepartmentId === null || rawDepartmentId === undefined || rawDepartmentId === ""
          ? null
          : parsePositiveInt(rawDepartmentId);
      const roleId = parsePositiveInt(row.roleId) ?? STAFF_ROLE_ID;
      const needsDepartment = departmentId == null || !validDeptIds.has(departmentId);

      if (!empno) {
        failed += 1;
        results.push({ index, email, empno, status: "failed", error: "empno is required." });
        continue;
      }
      if (!email || !email.includes("@")) {
        failed += 1;
        results.push({ index, email, empno, status: "failed", error: "Invalid email." });
        continue;
      }
      if (seenEmails.has(email)) {
        skipped += 1;
        results.push({
          index,
          email,
          empno,
          status: "skipped",
          error: "Duplicate email in this upload.",
        });
        continue;
      }
      seenEmails.add(email);

      const insertDepartmentId = needsDepartment ? null : departmentId;

      try {
        const [result] = await pool.execute(
          `INSERT INTO staff (empno, JG, email, department_id, division, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [empno, jg, email, insertDepartmentId, division, roleId],
        );
        created += 1;
        if (needsDepartment) pendingDepartment += 1;
        results.push({
          index,
          email,
          empno,
          staffId: result.insertId,
          status: "created",
          pendingDepartment: needsDepartment,
        });
      } catch (err) {
        if (err?.code === "ER_DUP_ENTRY") {
          skipped += 1;
          results.push({
            index,
            email,
            empno,
            status: "skipped",
            error: "Email already exists.",
          });
        } else {
          failed += 1;
          const mapped = mapStaffDbError(err);
          results.push({
            index,
            email,
            empno,
            status: "failed",
            error: mapped.error,
          });
        }
      }
    }

    const status = created > 0 ? 201 : 400;
    return res.status(status).json({
      summary: { total: users.length, created, skipped, failed, pendingDepartment },
      results,
      message:
        created > 0
          ? pendingDepartment > 0
            ? `Imported ${created} staff account(s). ${pendingDepartment} need department assignment.`
            : `Imported ${created} staff account(s).`
          : "No staff accounts were imported.",
    });
  } catch (err) {
    console.error("Bulk create staff error:", err);
    const mapped = mapStaffDbError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

apiRouter.patch("/staff/:staffId", generalLimiter, async (req, res) => {
  const staffId = parsePositiveInt(req.params.staffId);
  if (!staffId) {
    return res.status(400).json({ error: "Invalid staff ID." });
  }

  const roleId = req.body?.roleId !== undefined ? parsePositiveInt(req.body.roleId) : undefined;
  const departmentId =
    req.body?.departmentId !== undefined ? parsePositiveInt(req.body.departmentId) : undefined;
  const empno =
    req.body?.empno !== undefined ? String(req.body.empno).trim() || null : undefined;
  const jg = req.body?.jg !== undefined ? String(req.body.jg).trim() || null : undefined;
  const division =
    req.body?.division !== undefined ? String(req.body.division).trim() || null : undefined;

  if (roleId === null && req.body?.roleId !== undefined) {
    return res.status(400).json({ error: "Invalid role." });
  }
  if (departmentId === null && req.body?.departmentId !== undefined) {
    return res.status(400).json({ error: "Invalid department." });
  }
  if (
    roleId === undefined &&
    departmentId === undefined &&
    empno === undefined &&
    jg === undefined &&
    division === undefined
  ) {
    return res.status(400).json({ error: "Provide at least one field to update." });
  }

  const sets = [];
  const params = [];
  if (roleId !== undefined) {
    sets.push("role_id = ?");
    params.push(roleId);
  }
  if (departmentId !== undefined) {
    sets.push("department_id = ?");
    params.push(departmentId);
  }
  if (empno !== undefined) {
    sets.push("empno = ?");
    params.push(empno);
  }
  if (jg !== undefined) {
    sets.push("JG = ?");
    params.push(jg);
  }
  if (division !== undefined) {
    sets.push("division = ?");
    params.push(division);
  }
  params.push(staffId);

  try {
    const [result] = await pool.execute(
      `UPDATE staff SET ${sets.join(", ")} WHERE id = ?`,
      params,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Staff member not found." });
    }

    const [rows] = await pool.execute(
      `SELECT s.id, s.entra_id, s.empno, s.JG, s.email, s.department_id, s.division,
              d.department_name, s.role_id, r.role_name
       FROM staff s
       INNER JOIN role_table r ON r.role_id = s.role_id
       LEFT JOIN department_table d ON d.department_id = s.department_id
       WHERE s.id = ?
       LIMIT 1`,
      [staffId],
    );

    const row = rows[0];
    return res.json({
      staffId: row.id,
      fullName: displayNameFromEmail(row.email),
      email: row.email,
      empno: row.empno,
      jg: row.JG,
      division: row.division,
      entraId: row.entra_id,
      departmentId: row.department_id,
      departmentName: row.department_name,
      roleId: row.role_id,
      roleName: row.role_name,
      message: "Staff updated.",
    });
  } catch (err) {
    console.error("Update staff error:", err);
    const mapped = mapStaffDbError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

apiRouter.get("/users-by-department", generalLimiter, handleUsersByDepartment);
apiRouter.get("/admin/users-by-department", generalLimiter, handleUsersByDepartment);

apiRouter.get("/health", generalLimiter, async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (err) {
    console.error("Health check:", err);
    res.status(503).json({ ok: false, db: false, error: mapLoginDbError(err).error });
  }
});

apiRouter.use((req, res) => {
  res.status(404).json({
    error: "API route not found.",
    method: req.method,
    path: req.originalUrl,
    apiBuild: API_BUILD,
    hint:
      "Restart the Node API (npm run server). Local dev: use npm run dev:full. Verify GET /api/ping returns apiBuild 8.",
  });
});

app.use("/api", apiRouter);

if (serveStatic) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api") || req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      error: "API route not found.",
      method: req.method,
      path: req.originalUrl,
      apiBuild: API_BUILD,
      hint:
        "Deploy the latest server code (including server/auth/), run npm install, restart Node on Plesk, then check GET /api/ping for apiBuild 8.",
    });
  }
  res.status(404).type("text").send("Not found");
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  const message =
    err?.code === "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR"
      ? "Proxy configuration error. Set TRUST_PROXY on the server or RATE_LIMIT_VALIDATE_XFF=0."
      : "Internal server error.";
  res.status(500).json({ error: message });
});

const server = app.listen(port, host, () => {
  console.log(`CPD server listening on http://${host}:${port}`);
  console.log(`API build ${API_BUILD} — /api/ping, /api/auth/entra/profile, /api/users-by-department`);
  if (isMicrosoftSsoConfigured()) {
    console.log("Microsoft SSO: enabled");
  } else {
    console.log("Microsoft SSO: disabled (set AZURE_* in .env)");
  }
  console.log(
    serveStatic
      ? "Static UI: enabled (dist/) — for local dev prefer SERVE_STATIC=0 and http://localhost:8080"
      : "Static UI: disabled (API only) — use Vite on :8080",
  );
  scheduleAttachmentCleanup();
});

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the old Node process, then run npm run server again.`);
    console.error("Windows: netstat -ano | findstr :3001  then  taskkill /PID <pid> /F");
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});
