import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

import { requireAuth } from "./auth/requireAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads", "requisitions");

fs.mkdirSync(uploadsDir, { recursive: true });

const STATUS_SAVE_DRAFT = 1;
const STATUS_SUBMITTED = 2;

const ADMIN_ROLE_ID = 2;
const HOD_ROLE_ID = 3;

const HISTORY_STATUS_GROUPS = {
  submitted: ["submitted"],
  pending: ["being_process", "verified"],
  approved: ["approved"],
  rejected: ["rejected"],
  draft: ["save_draft"],
};

function displayNameFromEmail(email) {
  const local = String(email ?? "").split("@")[0] ?? "";
  return local.replace(/[._-]+/g, " ").trim() || email;
}

function parsePositiveInt(value, fallback = null) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const n = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function statusGroupFromDb(status) {
  if (status === "save_draft") return "draft";
  if (status === "submitted") return "submitted";
  if (status === "being_process" || status === "verified") return "pending";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "submitted";
}

function buildHistoryScope(user) {
  const roleId = user.roleId;
  const staffId = user.staffId;
  const departmentId = user.departmentId;

  if (roleId === ADMIN_ROLE_ID) {
    return { clause: "1=1", params: [] };
  }
  if (roleId === HOD_ROLE_ID) {
    return { clause: "s.department_id = ?", params: [departmentId] };
  }
  return { clause: "r.submitted_by = ?", params: [staffId] };
}

function buildHistoryStatusFilter(statusFilter) {
  const key = String(statusFilter ?? "all").trim().toLowerCase();
  if (key === "all" || !HISTORY_STATUS_GROUPS[key]) {
    return { clause: "", params: [] };
  }
  const statuses = HISTORY_STATUS_GROUPS[key];
  const placeholders = statuses.map(() => "?").join(", ");
  return { clause: `rs.details IN (${placeholders})`, params: statuses };
}

function mapHistoryRow(row) {
  const totalBudget =
    Number(row.mileage ?? 0) +
    Number(row.accommodation ?? 0) +
    Number(row.travel_fare ?? 0) +
    Number(row.others ?? 0);

  return {
    requisitionId: row.id,
    id: `REQ-${String(row.id).padStart(4, "0")}`,
    title: row.title,
    category: row.category,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    totalBudget,
    status: row.status,
    statusGroup: statusGroupFromDb(row.status),
    staffName: displayNameFromEmail(row.staff_email),
    staffEmail: row.staff_email,
    departmentName: row.department_name ?? null,
  };
}

async function queryRequisitionHistory(pool, { user, statusFilter, page, pageSize }) {
  const scope = buildHistoryScope(user);
  const status = buildHistoryStatusFilter(statusFilter);

  const whereParts = [scope.clause];
  const whereParams = [...scope.params];

  if (status.clause) {
    whereParts.push(status.clause);
    whereParams.push(...status.params);
  }

  const whereSql = whereParts.join(" AND ");

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN staff s ON s.id = r.submitted_by
     WHERE ${whereSql}`,
    whereParams,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const [rows] = await pool.execute(
    `SELECT r.id, r.category, r.title, r.created_at, r.updated_at,
            rs.details AS status,
            s.email AS staff_email,
            d.department_name,
            b.mileage, b.accommodation, b.travel_fare, b.others
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN staff s ON s.id = r.submitted_by
     INNER JOIN department_table d ON d.department_id = s.department_id
     INNER JOIN budget b ON b.id_budget = r.id_budget
     WHERE ${whereSql}
     ORDER BY r.updated_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    whereParams,
  );

  return {
    requisitions: rows.map(mapHistoryRow),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname ?? "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname ?? "").toLowerCase();
    const allowedExt = new Set([".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"]);
    const mime = String(file.mimetype ?? "");
    if (allowedExt.has(ext) || mime.startsWith("image/") || mime === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF and image files are allowed."));
  },
});

function parseDecimal(value) {
  if (value === undefined || value === null || String(value).trim() === "") return 0;
  const n = Number.parseFloat(String(value).trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function trimOrEmpty(value) {
  return String(value ?? "").trim();
}

function extractUniqueDates(slots) {
  if (!Array.isArray(slots)) return [];
  const seen = new Set();
  const dates = [];
  for (const slot of slots) {
    const date = trimOrEmpty(slot?.date);
    if (!date || seen.has(date)) continue;
    seen.add(date);
    dates.push(date);
    if (dates.length >= 5) break;
  }
  return dates;
}

function validateRequisitionBody(body, submitAs) {
  const errors = [];
  const category = trimOrEmpty(body?.category);
  const justification = trimOrEmpty(body?.justification);
  const title = trimOrEmpty(body?.programmeTitle);
  const venue = trimOrEmpty(body?.programmeVenue);
  const organiser = trimOrEmpty(body?.organiserName);
  const contactPerson = trimOrEmpty(body?.organiserContactPerson);
  const address = trimOrEmpty(body?.organiserAddress);
  const phone = trimOrEmpty(body?.organiserPhone);
  const email = trimOrEmpty(body?.organiserEmail);
  const dates = extractUniqueDates(body?.programmeSlots);

  if (submitAs === "submit") {
    if (!category) errors.push("Category is required.");
    if (!justification) errors.push("Justification is required.");
    if (!title) errors.push("Programme title is required.");
    if (!dates.length) errors.push("At least one programme date is required.");
    if (!venue) errors.push("Venue is required.");
    if (!organiser) errors.push("Organiser is required.");
    if (!contactPerson) errors.push("Contact person is required.");
    if (!address) errors.push("Organiser address is required.");
    if (!phone) errors.push("Phone number is required.");
    if (!email || !email.includes("@")) errors.push("A valid organiser email is required.");
  }

  return { errors, dates };
}

function mapRequisitionDbError(err) {
  const code = err?.code;
  const message = String(err?.message ?? "");

  if (code === "ER_NO_SUCH_TABLE") {
    return {
      status: 503,
      error: "Requisition tables are missing. Import db/schema.sql into the cpd database.",
    };
  }
  if (code === "ER_NO_REFERENCES_ROW_2" || code === "ER_NO_REFERENCES_ROW") {
    return { status: 400, error: "Invalid requisition reference data." };
  }
  if (message.includes("Only PDF and image")) {
    return { status: 400, error: message };
  }

  return { status: 500, error: "Unable to save requisition. Try again later." };
}

function documentPathsFromFiles(files) {
  return (files ?? []).slice(0, 3).map((file) => path.join("uploads", "requisitions", file.filename));
}

async function insertRequisition(pool, { staffId, body, files, statusId }) {
  const category = trimOrEmpty(body?.category);
  const justification = trimOrEmpty(body?.justification);
  const title = trimOrEmpty(body?.programmeTitle);
  const venue = trimOrEmpty(body?.programmeVenue);
  const organiser = trimOrEmpty(body?.organiserName);
  const contactPerson = trimOrEmpty(body?.organiserContactPerson);
  const address = trimOrEmpty(body?.organiserAddress);
  const phone = trimOrEmpty(body?.organiserPhone);
  const email = trimOrEmpty(body?.organiserEmail);
  const fundingClaim = trimOrEmpty(body?.fundingClaim);
  const hrdcClaimable = fundingClaim === "hrdc" ? 1 : 0;

  const mileage = parseDecimal(body?.budgetMileage);
  const accommodation = parseDecimal(body?.budgetAccommodation);
  const travelFare = parseDecimal(body?.budgetTravelFare);
  const others = parseDecimal(body?.budgetOthers) + parseDecimal(body?.programmeFees);

  const dates = extractUniqueDates(body?.programmeSlots);
  const docPaths = documentPathsFromFiles(files);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [budgetResult] = await conn.execute(
      `INSERT INTO budget (mileage, accommodation, travel_fare, others) VALUES (?, ?, ?, ?)`,
      [mileage, accommodation, travelFare, others],
    );
    const idBudget = budgetResult.insertId;

    const [dateResult] = await conn.execute(
      `INSERT INTO requisition_date (date_1, date_2, date_3, date_4, date_5) VALUES (?, ?, ?, ?, ?)`,
      [dates[0] ?? null, dates[1] ?? null, dates[2] ?? null, dates[3] ?? null, dates[4] ?? null],
    );
    const idDate = dateResult.insertId;

    let idDocuments = null;
    if (docPaths.length > 0) {
      const [docResult] = await conn.execute(
        `INSERT INTO requisition_documents (path_1, path_2, path_3) VALUES (?, ?, ?)`,
        [docPaths[0] ?? null, docPaths[1] ?? null, docPaths[2] ?? null],
      );
      idDocuments = docResult.insertId;
    }

    const [reqResult] = await conn.execute(
      `INSERT INTO requisitions (
        submitted_by, category, justification, title, venue, HRDC_claimable,
        organiser, contact_person, address, phone_num, email,
        id_date, id_budget, id_documents, status_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        category,
        justification,
        title,
        venue,
        hrdcClaimable,
        organiser,
        contactPerson,
        address,
        phone,
        email,
        idDate,
        idBudget,
        idDocuments,
        statusId,
      ],
    );
    const requisitionId = reqResult.insertId;

    await conn.execute(
      `INSERT INTO requisition_audit_log (requisition_id, changed_by, old_status_id, new_status_id, remarks)
       VALUES (?, ?, NULL, ?, NULL)`,
      [requisitionId, staffId, statusId],
    );

    await conn.commit();
    return { requisitionId, statusId };
  } catch (err) {
    await conn.rollback();
    for (const file of files ?? []) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore cleanup errors */
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}

function parseRequisitionBody(req) {
  const raw = req.body?.data;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === "object") {
    return raw;
  }
  return req.body ?? null;
}

export function registerRequisitionRoutes(apiRouter, { pool, generalLimiter }) {
  apiRouter.post(
    "/requisitions",
    generalLimiter,
    requireAuth,
    (req, res, next) => {
      upload.array("documents", 3)(req, res, (err) => {
        if (err) {
          const mapped = mapRequisitionDbError(err);
          return res.status(mapped.status).json({ error: mapped.error });
        }
        next();
      });
    },
    async (req, res) => {
      const body = parseRequisitionBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid requisition payload." });
      }

      const submitAs = trimOrEmpty(body.submitAs) === "submit" ? "submit" : "draft";
      const statusId = submitAs === "submit" ? STATUS_SUBMITTED : STATUS_SAVE_DRAFT;
      const { errors } = validateRequisitionBody(body, submitAs);

      if (errors.length) {
        for (const file of req.files ?? []) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            /* ignore */
          }
        }
        return res.status(400).json({ error: errors.join(" ") });
      }

      try {
        const result = await insertRequisition(pool, {
          staffId: req.session.user.staffId,
          body,
          files: req.files,
          statusId,
        });

        return res.status(201).json({
          requisitionId: result.requisitionId,
          statusId: result.statusId,
          status: submitAs === "submit" ? "submitted" : "save_draft",
          message:
            submitAs === "submit"
              ? "Requisition submitted successfully."
              : "Requisition saved as draft.",
        });
      } catch (err) {
        console.error("Create requisition error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.get("/requisitions/history", generalLimiter, requireAuth, async (req, res) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10) ?? 10, 100);
      const statusFilter = String(req.query.status ?? "all").trim().toLowerCase();

      const result = await queryRequisitionHistory(pool, {
        user: req.session.user,
        statusFilter,
        page,
        pageSize,
      });

      return res.json(result);
    } catch (err) {
      console.error("Requisition history error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/mine", generalLimiter, requireAuth, async (req, res) => {
    try {
      const result = await queryRequisitionHistory(pool, {
        user: req.session.user,
        statusFilter: "all",
        page: 1,
        pageSize: 100,
      });

      return res.json({
        requisitions: result.requisitions.map((row) => ({
          requisitionId: row.requisitionId,
          category: row.category,
          title: row.title,
          status: row.status,
          createdAt: row.submittedAt,
          updatedAt: row.updatedAt,
        })),
      });
    } catch (err) {
      console.error("List requisitions error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });
}
