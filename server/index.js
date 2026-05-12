import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(express.json({ limit: "20kb" }));

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

app.post("/api/login", async (req, res) => {
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
    return res.status(500).json({ error: "Unable to sign in. Try again later." });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (err) {
    console.error("Health check:", err);
    res.status(503).json({ ok: false, db: false });
  }
});
