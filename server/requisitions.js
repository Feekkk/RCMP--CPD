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
const STATUS_BEING_PROCESS = 3;
const STATUS_REJECTED = 6;
const STATUS_REJECTED_HOD = 9;
const HOD_ROLE_ID = 3;
const EDITABLE_STATUSES = new Set(["save_draft", "rejected_hod"]);

const HISTORY_PHASES = ["draft", "pre_training", "post_training", "completed", "rejected"];

const WORKFLOW_PHASE_SQL = `
  CASE
    WHEN rs.details = 'save_draft' THEN 'draft'
    WHEN rs.details IN ('rejected', 'rejected_hod', 'rejected_hr') THEN 'rejected'
    WHEN rs.details IN ('submitted', 'being_process', 'verified') THEN 'pre_training'
    WHEN rs.details = 'approved' AND (
      COALESCE(pt.cpd_points_counted, 0) = 1
      OR (
        COALESCE(pt.attendance_attached, 0) = 1
        AND COALESCE(pt.e_survey_filled, 0) = 1
        AND COALESCE(pt.hod_evaluation_filled, 0) = 1
      )
    ) THEN 'completed'
    WHEN rs.details = 'approved' AND GREATEST(
      IFNULL(rd.date_1, '0000-01-01'),
      IFNULL(rd.date_2, '0000-01-01'),
      IFNULL(rd.date_3, '0000-01-01'),
      IFNULL(rd.date_4, '0000-01-01'),
      IFNULL(rd.date_5, '0000-01-01')
    ) < CURDATE() THEN 'post_training'
    WHEN rs.details = 'approved' THEN 'pre_training'
    ELSE 'pre_training'
  END
`;

const HISTORY_FROM_JOINS = `
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN staff s ON s.id = r.submitted_by
  INNER JOIN department_table d ON d.department_id = s.department_id
  INNER JOIN budget b ON b.id_budget = r.id_budget
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN post_training pt ON pt.requisition_id = r.id
`;

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
  if (status === "rejected" || status === "rejected_hod" || status === "rejected_hr") return "rejected";
  return "submitted";
}

function buildHistoryScope(user) {
  return { clause: "r.submitted_by = ?", params: [user.staffId] };
}

function requireHod(req, res, next) {
  if (!req.session?.user?.staffId) {
    return res.status(401).json({ error: "Not signed in." });
  }
  if (req.session.user.roleId !== HOD_ROLE_ID) {
    return res.status(403).json({ error: "Head of Department access required." });
  }
  if (!req.session.user.departmentId) {
    return res.status(403).json({ error: "Your account has no department assigned." });
  }
  next();
}

function hodQueueStatusFromDb(status) {
  if (status === "being_process") return "recommended";
  if (status === "submitted") return "pending";
  return "pending";
}

const HOD_REVIEW_DETAIL_SELECT = `
  SELECT r.id, r.category, r.title, r.justification, r.venue, r.HRDC_claimable, r.created_at,
         r.organiser, r.contact_person, r.address, r.phone_num, r.email,
         rs.details AS status,
         s.email AS staff_email,
         d.department_name,
         b.mileage, b.accommodation, b.travel_fare, b.others,
         rd.date_1, rd.time_1, rd.time_to_1,
         rd.date_2, rd.time_2, rd.time_to_2,
         rd.date_3, rd.time_3, rd.time_to_3,
         rd.date_4, rd.time_4, rd.time_to_4,
         rd.date_5, rd.time_5, rd.time_to_5,
         doc.path_1, doc.path_2, doc.path_3
`;

const HOD_REVIEW_DETAIL_JOINS = `
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN staff s ON s.id = r.submitted_by
  INNER JOIN department_table d ON d.department_id = s.department_id
  INNER JOIN budget b ON b.id_budget = r.id_budget
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
`;

function documentNameFromPath(filePath) {
  return path.basename(String(filePath ?? ""));
}

function mapHodReviewDocuments(requisitionId, row) {
  return [row.path_1, row.path_2, row.path_3]
    .map((filePath, index) => ({ filePath, index }))
    .filter((entry) => Boolean(entry.filePath))
    .map(({ filePath, index }) => ({
      index,
      name: documentNameFromPath(filePath),
      url: `/api/requisitions/${requisitionId}/documents/${index}`,
    }));
}

function mapHodReviewRow(row) {
  const mileage = Number(row.mileage ?? 0);
  const accommodation = Number(row.accommodation ?? 0);
  const travelFare = Number(row.travel_fare ?? 0);
  const others = Number(row.others ?? 0);
  const programmeSlots = extractProgrammeSlotsFromRow(row);

  return {
    requisitionId: row.id,
    id: `REQ-${String(row.id).padStart(4, "0")}`,
    title: row.title,
    category: row.category,
    venue: row.venue ?? "",
    justification: row.justification ?? "",
    submittedAt: row.created_at,
    programmeDates: collectProgrammeDates(row),
    programmeSlots,
    totalBudget: mileage + accommodation + travelFare + others,
    budget: {
      mileage,
      accommodation,
      travelFare,
      others,
      total: mileage + accommodation + travelFare + others,
    },
    status: row.status,
    hodStatus: hodQueueStatusFromDb(row.status),
    staffName: displayNameFromEmail(row.staff_email),
    staffEmail: row.staff_email,
    departmentName: row.department_name ?? null,
    hrdcClaimable: Number(row.HRDC_claimable ?? 0) === 1,
    fundingClaim: Number(row.HRDC_claimable ?? 0) === 1 ? "hrdc" : "",
    organiser: {
      name: row.organiser ?? "",
      contactPerson: row.contact_person ?? "",
      address: row.address ?? "",
      phone: row.phone_num ?? "",
      email: row.email ?? "",
    },
    documents: mapHodReviewDocuments(row.id, row),
  };
}

function resolveUploadPath(relativePath) {
  const uploadsRoot = path.resolve(path.join(__dirname, "..", "uploads", "requisitions"));
  const resolved = path.resolve(path.join(__dirname, "..", String(relativePath ?? "")));
  if (!resolved.startsWith(uploadsRoot)) {
    return null;
  }
  return resolved;
}

async function queryHodReviewDetail(pool, requisitionId, departmentId) {
  const [rows] = await pool.execute(
    `${HOD_REVIEW_DETAIL_SELECT}
     ${HOD_REVIEW_DETAIL_JOINS}
     WHERE r.id = ?
       AND s.department_id = ?
       AND rs.details IN ('submitted', 'being_process')
     LIMIT 1`,
    [requisitionId, departmentId],
  );

  const row = rows[0];
  if (!row) return null;
  return mapHodReviewRow(row);
}

async function fetchHodRequisitionDocumentPath(pool, requisitionId, departmentId, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return null;

  const [rows] = await pool.execute(
    `SELECT doc.path_1, doc.path_2, doc.path_3
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN staff s ON s.id = r.submitted_by
     LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
     WHERE r.id = ?
       AND s.department_id = ?
       AND rs.details IN ('submitted', 'being_process')
     LIMIT 1`,
    [requisitionId, departmentId],
  );

  const row = rows[0];
  if (!row) return null;

  const paths = [row.path_1, row.path_2, row.path_3];
  const relativePath = paths[slotIndex];
  if (!relativePath) return null;

  return resolveUploadPath(relativePath);
}

function mimeTypeForDocument(filePath) {
  const ext = path.extname(String(filePath ?? "")).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function queryHodReviewQueue(pool, departmentId) {
  const [rows] = await pool.execute(
    `${HOD_REVIEW_DETAIL_SELECT}
     ${HOD_REVIEW_DETAIL_JOINS}
     WHERE s.department_id = ?
       AND rs.details IN ('submitted', 'being_process')
     ORDER BY r.created_at DESC`,
    [departmentId],
  );

  const items = rows.map(mapHodReviewRow);

  return {
    requisitions: items,
    summary: {
      total: items.length,
      pending: items.filter((item) => item.hodStatus === "pending").length,
      recommended: items.filter((item) => item.hodStatus === "recommended").length,
    },
  };
}

async function fetchDepartmentRequisitionForHod(pool, requisitionId, departmentId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.status_id, rs.details AS status
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN staff s ON s.id = r.submitted_by
     WHERE r.id = ? AND s.department_id = ?
     LIMIT 1`,
    [requisitionId, departmentId],
  );
  return rows[0] ?? null;
}

async function hodReviewRequisition(pool, { requisitionId, departmentId, reviewerStaffId, decision, remarks }) {
  const row = await fetchDepartmentRequisitionForHod(pool, requisitionId, departmentId);
  if (!row) {
    return { error: "Requisition not found in your department.", status: 404 };
  }

  if (row.status !== "submitted") {
    return {
      error:
        row.status === "being_process"
          ? "This requisition has already been recommended."
          : "Only submitted requisitions can be reviewed.",
      status: 400,
    };
  }

  const trimmedRemarks = trimOrEmpty(remarks);
  if (decision === "reject" && !trimmedRemarks) {
    return { error: "A rejection remark is required.", status: 400 };
  }
  if (trimmedRemarks.length > 500) {
    return { error: "Remarks must be 500 characters or fewer.", status: 400 };
  }

  const newStatusId = decision === "reject" ? STATUS_REJECTED_HOD : STATUS_BEING_PROCESS;
  const newStatus = decision === "reject" ? "rejected_hod" : "being_process";
  const auditRemarks =
    decision === "reject" ? trimmedRemarks : trimmedRemarks || "Recommended by HOD";

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(`UPDATE requisitions SET status_id = ? WHERE id = ?`, [newStatusId, requisitionId]);

    await conn.execute(
      `INSERT INTO requisition_audit_log (requisition_id, changed_by, old_status_id, new_status_id, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [requisitionId, reviewerStaffId, row.status_id, newStatusId, auditRemarks],
    );

    await conn.commit();
    return { requisitionId, statusId: newStatusId, status: newStatus };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function buildHistoryPhaseFilter(phaseFilter) {
  const key = String(phaseFilter ?? "all").trim().toLowerCase();
  if (key === "all" || !HISTORY_PHASES.includes(key)) {
    return { clause: "", params: [] };
  }
  return { clause: `(${WORKFLOW_PHASE_SQL}) = ?`, params: [key] };
}

function collectProgrammeDates(row) {
  return extractProgrammeSlotsFromRow(row).map((slot) => slot.date);
}

function formatTimeForInput(value) {
  if (value === undefined || value === null || value === "") return "";
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  const text = String(value).trim();
  if (!text) return "";
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeTime(value) {
  const text = trimOrEmpty(value);
  if (!text) return null;
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function extractProgrammeSlots(slots) {
  if (!Array.isArray(slots)) return [];
  const result = [];
  for (const slot of slots) {
    const date = trimOrEmpty(slot?.date);
    if (!date) continue;
    result.push({
      date,
      from: normalizeTime(slot?.from),
      to: normalizeTime(slot?.to),
    });
    if (result.length >= 5) break;
  }
  return result;
}

function extractProgrammeSlotsFromRow(row) {
  const slots = [];
  for (let i = 1; i <= 5; i += 1) {
    const date = row[`date_${i}`];
    if (date == null) continue;
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
    slots.push({
      date: dateStr,
      from: formatTimeForInput(row[`time_${i}`]),
      to: formatTimeForInput(row[`time_to_${i}`]),
    });
  }
  return slots;
}

function programmeSlotSqlValues(slots) {
  const values = {
    dates: [null, null, null, null, null],
    times: [null, null, null, null, null],
    timesTo: [null, null, null, null, null],
  };
  for (let i = 0; i < Math.min(slots.length, 5); i += 1) {
    values.dates[i] = slots[i].date;
    values.times[i] = slots[i].from;
    values.timesTo[i] = slots[i].to;
  }
  return values;
}

function deriveWorkflowPhase(status, row) {
  if (status === "save_draft") return "draft";
  if (status === "rejected" || status === "rejected_hod" || status === "rejected_hr") return "rejected";
  if (status === "submitted" || status === "being_process" || status === "verified") {
    return "pre_training";
  }
  if (status === "approved") {
    const attendance = Number(row.attendance_attached ?? 0) === 1;
    const survey = Number(row.e_survey_filled ?? 0) === 1;
    const hodEval = Number(row.hod_evaluation_filled ?? 0) === 1;
    const cpdCounted = Number(row.cpd_points_counted ?? 0) === 1;
    if (cpdCounted || (attendance && survey && hodEval)) return "completed";

    const dates = collectProgrammeDates(row);
    if (dates.length) {
      const last = dates.reduce((a, b) => (a > b ? a : b));
      const today = new Date().toISOString().slice(0, 10);
      if (last < today) return "post_training";
    }
    return "pre_training";
  }
  return "pre_training";
}

function mapHistoryRow(row) {
  const totalBudget =
    Number(row.mileage ?? 0) +
    Number(row.accommodation ?? 0) +
    Number(row.travel_fare ?? 0) +
    Number(row.others ?? 0);

  const programmeDates = collectProgrammeDates(row);
  const workflowPhase = deriveWorkflowPhase(row.status, row);

  const attendanceAttached = Number(row.attendance_attached ?? 0) === 1;
  const eSurveyFilled = Number(row.e_survey_filled ?? 0) === 1;
  const hodEvaluationFilled = Number(row.hod_evaluation_filled ?? 0) === 1;
  const cpdPointsCounted = Number(row.cpd_points_counted ?? 0) === 1;
  const postTrainingSteps = [attendanceAttached, eSurveyFilled, hodEvaluationFilled];
  const postTrainingCompleted = postTrainingSteps.filter(Boolean).length;

  return {
    requisitionId: row.id,
    id: `REQ-${String(row.id).padStart(4, "0")}`,
    title: row.title,
    category: row.category,
    venue: row.venue,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    programmeDates,
    totalBudget,
    status: row.status,
    statusGroup: statusGroupFromDb(row.status),
    workflowPhase,
    staffName: displayNameFromEmail(row.staff_email),
    staffEmail: row.staff_email,
    departmentName: row.department_name ?? null,
    hrdcClaimable: Number(row.HRDC_claimable ?? 0) === 1,
    rejectionRemarks: row.rejection_remarks ?? null,
    postTraining: {
      attendanceAttached,
      eSurveyFilled,
      hodEvaluationFilled,
      cpdPointsCounted,
      cpdPoints: row.cpd_points != null ? Number(row.cpd_points) : null,
      completedSteps: postTrainingCompleted,
      totalSteps: 3,
      isComplete: cpdPointsCounted || postTrainingCompleted === 3,
    },
  };
}

async function queryHistorySummary(pool, user) {
  const scope = buildHistoryScope(user);
  const [rows] = await pool.execute(
    `SELECT (${WORKFLOW_PHASE_SQL}) AS workflow_phase, COUNT(*) AS cnt
     ${HISTORY_FROM_JOINS}
     WHERE ${scope.clause}
     GROUP BY workflow_phase`,
    scope.params,
  );

  const summary = {
    all: 0,
    draft: 0,
    preTraining: 0,
    postTraining: 0,
    completed: 0,
    rejected: 0,
  };

  for (const row of rows) {
    const count = Number(row.cnt ?? 0);
    summary.all += count;
    switch (row.workflow_phase) {
      case "draft":
        summary.draft = count;
        break;
      case "pre_training":
        summary.preTraining = count;
        break;
      case "post_training":
        summary.postTraining = count;
        break;
      case "completed":
        summary.completed = count;
        break;
      case "rejected":
        summary.rejected = count;
        break;
      default:
        break;
    }
  }

  return summary;
}

async function queryRequisitionHistory(pool, { user, phaseFilter, page, pageSize }) {
  const scope = buildHistoryScope(user);
  const phase = buildHistoryPhaseFilter(phaseFilter);

  const whereParts = [scope.clause];
  const whereParams = [...scope.params];

  if (phase.clause) {
    whereParts.push(phase.clause);
    whereParams.push(...phase.params);
  }

  const whereSql = whereParts.join(" AND ");

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     ${HISTORY_FROM_JOINS}
     WHERE ${whereSql}`,
    whereParams,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const [rows] = await pool.execute(
    `SELECT r.id, r.category, r.title, r.venue, r.HRDC_claimable, r.created_at, r.updated_at,
            rs.details AS status,
            s.email AS staff_email,
            d.department_name,
            b.mileage, b.accommodation, b.travel_fare, b.others,
            rd.date_1, rd.time_1, rd.time_to_1,
            rd.date_2, rd.time_2, rd.time_to_2,
            rd.date_3, rd.time_3, rd.time_to_3,
            rd.date_4, rd.time_4, rd.time_to_4,
            rd.date_5, rd.time_5, rd.time_to_5,
            pt.attendance_attached, pt.e_survey_filled, pt.hod_evaluation_filled,
            pt.cpd_points_counted, pt.cpd_points,
            (SELECT al.remarks
             FROM requisition_audit_log al
             WHERE al.requisition_id = r.id AND al.new_status_id = ?
             ORDER BY al.created_at DESC
             LIMIT 1) AS rejection_remarks
     ${HISTORY_FROM_JOINS}
     WHERE ${whereSql}
     ORDER BY r.updated_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    [STATUS_REJECTED_HOD, ...whereParams],
  );

  const summary = await queryHistorySummary(pool, user);

  return {
    requisitions: rows.map(mapHistoryRow),
    total,
    page: safePage,
    pageSize,
    totalPages,
    summary,
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
  return extractProgrammeSlots(slots).map((slot) => slot.date);
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
  const programmeSlots = extractProgrammeSlots(body?.programmeSlots);

  if (submitAs === "submit") {
    if (!category) errors.push("Category is required.");
    if (!justification) errors.push("Justification is required.");
    if (!title) errors.push("Programme title is required.");
    if (!programmeSlots.length) errors.push("At least one programme date is required.");
    if (!venue) errors.push("Venue is required.");
    if (!organiser) errors.push("Organiser is required.");
    if (!contactPerson) errors.push("Contact person is required.");
    if (!address) errors.push("Organiser address is required.");
    if (!phone) errors.push("Phone number is required.");
    if (!email || !email.includes("@")) errors.push("A valid organiser email is required.");
  }

  return { errors, programmeSlots };
}

function mapRequisitionDbError(err) {
  const code = err?.code;
  const message = String(err?.message ?? "");

  if (code === "ER_BAD_FIELD_ERROR" && message.includes("time_")) {
    return {
      status: 503,
      error: "Database requisition_date table is outdated. Run db/migrations/add_requisition_times.sql.",
    };
  }
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

async function fetchOwnedDraftRequisition(pool, requisitionId, staffId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.submitted_by, r.category, r.justification, r.title, r.venue, r.HRDC_claimable,
            r.organiser, r.contact_person, r.address, r.phone_num, r.email,
            r.id_date, r.id_budget, r.id_documents, r.status_id,
            rs.details AS status,
            b.mileage, b.accommodation, b.travel_fare, b.others,
            rd.date_1, rd.time_1, rd.time_to_1,
            rd.date_2, rd.time_2, rd.time_to_2,
            rd.date_3, rd.time_3, rd.time_to_3,
            rd.date_4, rd.time_4, rd.time_to_4,
            rd.date_5, rd.time_5, rd.time_to_5,
            doc.path_1, doc.path_2, doc.path_3
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN budget b ON b.id_budget = r.id_budget
     INNER JOIN requisition_date rd ON rd.id_date = r.id_date
     LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
     WHERE r.id = ? AND r.submitted_by = ?
     LIMIT 1`,
    [requisitionId, staffId],
  );
  return rows[0] ?? null;
}

function mapRequisitionToForm(row) {
  const programmeSlots = extractProgrammeSlotsFromRow(row);
  const slotsForForm = programmeSlots.length
    ? programmeSlots.map((slot) => ({ date: slot.date, from: slot.from, to: slot.to }))
    : [{ date: "", from: "", to: "" }];

  return {
    requisitionId: row.id,
    status: row.status,
    category: row.category ?? "",
    justification: row.justification ?? "",
    programmeTitle: row.title ?? "",
    programmeSlots: slotsForForm,
    programmeVenue: row.venue ?? "",
    programmeFees: "",
    fundingClaim: Number(row.HRDC_claimable) === 1 ? "hrdc" : "",
    organiserName: row.organiser ?? "",
    organiserAddress: row.address ?? "",
    organiserPhone: row.phone_num ?? "",
    organiserEmail: row.email ?? "",
    organiserContactPerson: row.contact_person ?? "",
    budgetMileage: String(row.mileage ?? 0),
    budgetAccommodation: String(row.accommodation ?? 0),
    budgetTravelFare: String(row.travel_fare ?? 0),
    budgetOthers: String(row.others ?? 0),
    existingDocuments: [row.path_1, row.path_2, row.path_3].filter(Boolean),
  };
}

async function updateRequisition(pool, { requisitionId, staffId, body, files, statusId }) {
  const existing = await fetchOwnedDraftRequisition(pool, requisitionId, staffId);
  if (!existing) {
    return { error: "Requisition not found.", status: 404 };
  }
  if (!EDITABLE_STATUSES.has(existing.status)) {
    return { error: "This requisition cannot be edited.", status: 400 };
  }
  if (existing.status === "rejected_hod" && statusId === STATUS_SAVE_DRAFT) {
    statusId = STATUS_REJECTED_HOD;
  }

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

  const programmeSlots = extractProgrammeSlots(body?.programmeSlots);
  const slotValues = programmeSlotSqlValues(programmeSlots);
  const docPaths = documentPathsFromFiles(files);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE budget SET mileage = ?, accommodation = ?, travel_fare = ?, others = ? WHERE id_budget = ?`,
      [mileage, accommodation, travelFare, others, existing.id_budget],
    );

    await conn.execute(
      `UPDATE requisition_date SET
        date_1 = ?, time_1 = ?, time_to_1 = ?,
        date_2 = ?, time_2 = ?, time_to_2 = ?,
        date_3 = ?, time_3 = ?, time_to_3 = ?,
        date_4 = ?, time_4 = ?, time_to_4 = ?,
        date_5 = ?, time_5 = ?, time_to_5 = ?
       WHERE id_date = ?`,
      [
        slotValues.dates[0], slotValues.times[0], slotValues.timesTo[0],
        slotValues.dates[1], slotValues.times[1], slotValues.timesTo[1],
        slotValues.dates[2], slotValues.times[2], slotValues.timesTo[2],
        slotValues.dates[3], slotValues.times[3], slotValues.timesTo[3],
        slotValues.dates[4], slotValues.times[4], slotValues.timesTo[4],
        existing.id_date,
      ],
    );

    let idDocuments = existing.id_documents;
    if (docPaths.length > 0) {
      if (idDocuments) {
        await conn.execute(
          `UPDATE requisition_documents SET path_1 = ?, path_2 = ?, path_3 = ? WHERE id_documents = ?`,
          [docPaths[0] ?? null, docPaths[1] ?? null, docPaths[2] ?? null, idDocuments],
        );
      } else {
        const [docResult] = await conn.execute(
          `INSERT INTO requisition_documents (path_1, path_2, path_3) VALUES (?, ?, ?)`,
          [docPaths[0] ?? null, docPaths[1] ?? null, docPaths[2] ?? null],
        );
        idDocuments = docResult.insertId;
      }
    }

    const resubmitting = existing.status === "rejected_hod" && statusId === STATUS_SUBMITTED;

    await conn.execute(
      `UPDATE requisitions SET
        category = ?, justification = ?, title = ?, venue = ?, HRDC_claimable = ?,
        organiser = ?, contact_person = ?, address = ?, phone_num = ?, email = ?,
        id_documents = ?, status_id = ?,
        recommended_by = CASE WHEN ? THEN NULL ELSE recommended_by END
       WHERE id = ?`,
      [
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
        idDocuments,
        statusId,
        resubmitting ? 1 : 0,
        requisitionId,
      ],
    );

    if (statusId !== existing.status_id) {
      const auditRemarks = resubmitting ? "Resubmitted after HOD rejection" : null;
      await conn.execute(
        `INSERT INTO requisition_audit_log (requisition_id, changed_by, old_status_id, new_status_id, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [requisitionId, staffId, existing.status_id, statusId, auditRemarks],
      );
    }

    await conn.commit();
    return { requisitionId, statusId };
  } catch (err) {
    await conn.rollback();
    for (const file of files ?? []) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function resubmitRejectedRequisition(pool, { requisitionId, staffId }) {
  const existing = await fetchOwnedDraftRequisition(pool, requisitionId, staffId);
  if (!existing) {
    return { error: "Requisition not found.", status: 404 };
  }
  if (existing.status !== "rejected_hod") {
    return { error: "Only HOD-rejected requisitions can be resubmitted.", status: 400 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE requisitions SET status_id = ?, recommended_by = NULL WHERE id = ?`,
      [STATUS_SUBMITTED, requisitionId],
    );

    await conn.execute(
      `INSERT INTO requisition_audit_log (requisition_id, changed_by, old_status_id, new_status_id, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [requisitionId, staffId, existing.status_id, STATUS_SUBMITTED, "Resubmitted after HOD rejection"],
    );

    await conn.commit();
    return { requisitionId, statusId: STATUS_SUBMITTED, status: "submitted" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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

  const programmeSlots = extractProgrammeSlots(body?.programmeSlots);
  const slotValues = programmeSlotSqlValues(programmeSlots);
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
      `INSERT INTO requisition_date (
        date_1, time_1, time_to_1,
        date_2, time_2, time_to_2,
        date_3, time_3, time_to_3,
        date_4, time_4, time_to_4,
        date_5, time_5, time_to_5
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slotValues.dates[0], slotValues.times[0], slotValues.timesTo[0],
        slotValues.dates[1], slotValues.times[1], slotValues.timesTo[1],
        slotValues.dates[2], slotValues.times[2], slotValues.timesTo[2],
        slotValues.dates[3], slotValues.times[3], slotValues.timesTo[3],
        slotValues.dates[4], slotValues.times[4], slotValues.timesTo[4],
      ],
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
      const phaseFilter = String(req.query.phase ?? req.query.status ?? "all").trim().toLowerCase();

      const result = await queryRequisitionHistory(pool, {
        user: req.session.user,
        phaseFilter,
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

  apiRouter.get("/requisitions/hod/review-queue", generalLimiter, requireHod, async (req, res) => {
    try {
      const result = await queryHodReviewQueue(pool, req.session.user.departmentId);
      return res.json(result);
    } catch (err) {
      console.error("HOD review queue error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/:requisitionId/hod-review", generalLimiter, requireHod, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const detail = await queryHodReviewDetail(pool, requisitionId, req.session.user.departmentId);
      if (!detail) {
        return res.status(404).json({ error: "Requisition not found in your department." });
      }
      return res.json(detail);
    } catch (err) {
      console.error("HOD review detail error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get(
    "/requisitions/:requisitionId/documents/:documentIndex",
    generalLimiter,
    requireHod,
    async (req, res) => {
      const requisitionId = parsePositiveInt(req.params.requisitionId);
      const documentIndex = Number.parseInt(String(req.params.documentIndex ?? ""), 10);

      if (!requisitionId) {
        return res.status(400).json({ error: "Invalid requisition ID." });
      }
      if (!Number.isFinite(documentIndex) || documentIndex < 0 || documentIndex > 2) {
        return res.status(400).json({ error: "Invalid document index." });
      }

      try {
        const absolutePath = await fetchHodRequisitionDocumentPath(
          pool,
          requisitionId,
          req.session.user.departmentId,
          documentIndex,
        );

        if (!absolutePath || !fs.existsSync(absolutePath)) {
          return res.status(404).json({ error: "Document not found." });
        }

        res.setHeader("Content-Type", mimeTypeForDocument(absolutePath));
        res.setHeader("Content-Disposition", `inline; filename="${documentNameFromPath(absolutePath)}"`);
        return res.sendFile(absolutePath);
      } catch (err) {
        console.error("HOD document download error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.post("/requisitions/:requisitionId/hod-review", generalLimiter, requireHod, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    const decision = String(req.body?.decision ?? "").trim().toLowerCase();
    if (decision !== "recommend" && decision !== "reject") {
      return res.status(400).json({ error: 'Decision must be "recommend" or "reject".' });
    }

    const remarks = req.body?.remarks;

    try {
      const result = await hodReviewRequisition(pool, {
        requisitionId,
        departmentId: req.session.user.departmentId,
        reviewerStaffId: req.session.user.staffId,
        decision,
        remarks,
      });

      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({
        requisitionId: result.requisitionId,
        statusId: result.statusId,
        status: result.status,
        message:
          decision === "reject"
            ? "Requisition rejected."
            : "Requisition recommended to the next step.",
      });
    } catch (err) {
      console.error("HOD review error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/mine", generalLimiter, requireAuth, async (req, res) => {
    try {
      const result = await queryRequisitionHistory(pool, {
        user: req.session.user,
        phaseFilter: "all",
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

  apiRouter.get("/requisitions/:requisitionId", generalLimiter, requireAuth, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const row = await fetchOwnedDraftRequisition(pool, requisitionId, req.session.user.staffId);
      if (!row) {
        return res.status(404).json({ error: "Requisition not found." });
      }
      if (!EDITABLE_STATUSES.has(row.status)) {
        return res.status(400).json({ error: "This requisition cannot be edited." });
      }

      return res.json(mapRequisitionToForm(row));
    } catch (err) {
      console.error("Get requisition error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.patch(
    "/requisitions/:requisitionId",
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
      const requisitionId = parsePositiveInt(req.params.requisitionId);
      if (!requisitionId) {
        return res.status(400).json({ error: "Invalid requisition ID." });
      }

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
        const result = await updateRequisition(pool, {
          requisitionId,
          staffId: req.session.user.staffId,
          body,
          files: req.files,
          statusId,
        });

        if (result.error) {
          for (const file of req.files ?? []) {
            try {
              fs.unlinkSync(file.path);
            } catch {
              /* ignore */
            }
          }
          return res.status(result.status).json({ error: result.error });
        }

        return res.json({
          requisitionId: result.requisitionId,
          statusId: result.statusId,
          status: submitAs === "submit" ? "submitted" : "save_draft",
          message:
            submitAs === "submit"
              ? "Requisition submitted successfully."
              : "Draft updated successfully.",
        });
      } catch (err) {
        console.error("Update requisition error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.post("/requisitions/:requisitionId/resubmit", generalLimiter, requireAuth, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const result = await resubmitRejectedRequisition(pool, {
        requisitionId,
        staffId: req.session.user.staffId,
      });

      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({
        requisitionId: result.requisitionId,
        statusId: result.statusId,
        status: result.status,
        message: "Requisition resubmitted to your Head of Department.",
      });
    } catch (err) {
      console.error("Resubmit requisition error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });
}
