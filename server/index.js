import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const host = process.env.HOST || "0.0.0.0";

// Plesk / nginx / Passenger: trust proxy for rate limiting and HTTPS
app.set("trust proxy", process.env.TRUST_PROXY === "0" ? false : true);
app.use(express.json({ limit: "20kb" }));

app.use(
  helmet({
    // CSP is tuned for Vite builds; disable here if the panel serves static files separately
    contentSecurityPolicy: process.env.HELMET_CSP === "1",
    crossOriginEmbedderPolicy: false,
  }),
);

const rateLimitValidate =
  process.env.RATE_LIMIT_VALIDATE_XFF === "0"
    ? { xForwardedForHeader: false }
    : {};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

function dashboardPathForRole(roleId) {
  switch (roleId) {
    case 1:
      return "/staff/dashboard";
    case 2:
      return "/admin/dashboard";
    case 3:
      return "/hod/dashboard";
    default:
      return "/staff/dashboard";
  }
}

function mapLoginDbError(err) {
  const code = err?.code;
  const message = String(err?.message ?? "");

  if (code === "ER_BAD_FIELD_ERROR" && message.includes("password_hash")) {
    return {
      status: 503,
      error: "Database is missing the password_hash column. Run db/migration_add_password_hash.sql.",
    };
  }
  if (code === "ER_NO_SUCH_TABLE" && (message.includes("staff") || message.includes("role_table"))) {
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

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, service: "api", uptime: Math.floor(process.uptime()) });
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const staffIdRaw = req.body?.staffId;
  const password = req.body?.password;

  if (password == null || staffIdRaw === undefined || staffIdRaw === null || String(staffIdRaw).trim() === "") {
    return res.status(400).json({ error: "Staff ID and password are required." });
  }

  const staffId = Number.parseInt(String(staffIdRaw).trim(), 10);
  if (!Number.isFinite(staffId) || staffId <= 0) {
    return res.status(400).json({ error: "Invalid Staff ID." });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT s.staff_id, s.full_name, s.password_hash, s.role_id, r.role_name
       FROM staff s
       INNER JOIN role_table r ON r.role_id = s.role_id
       WHERE s.staff_id = ?
       LIMIT 1`,
      [staffId],
    );

    const row = rows[0];
    if (!row) {
      return res.status(401).json({ error: "Invalid Staff ID or password." });
    }

    if (!row.password_hash || typeof row.password_hash !== "string") {
      return res.status(503).json({
        error: "Account has no password set. Run db/migration_add_password_hash.sql or re-import db/schema.sql.",
      });
    }

    const ok = await bcrypt.compare(String(password), row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid Staff ID or password." });
    }

    return res.json({
      staffId: row.staff_id,
      fullName: row.full_name,
      roleId: row.role_id,
      roleName: row.role_name,
      redirect: dashboardPathForRole(row.role_id),
    });
  } catch (err) {
    console.error("Login error:", err);
    const mapped = mapLoginDbError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.get("/api/health", generalLimiter, async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (err) {
    console.error("Health check:", err);
    res.status(503).json({ ok: false, db: false, error: mapLoginDbError(err).error });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  const message =
    err?.code === "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR"
      ? "Proxy configuration error. Set TRUST_PROXY on the server or RATE_LIMIT_VALIDATE_XFF=0."
      : "Internal server error.";
  res.status(500).json({ error: message });
});

app.listen(port, host, () => {
  console.log(`CPD server listening on http://${host}:${port}`);
  console.log(`Static UI: ${fs.existsSync(distPath) ? "enabled (dist/)" : "not found — run npm run build"}`);
});
