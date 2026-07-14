import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

import { requireAuth } from "./auth/requireAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads", "requisitions");
const postTrainingUploadsDir = path.join(__dirname, "..", "uploads", "post-training");

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(postTrainingUploadsDir, { recursive: true });

const STATUS_SAVE_DRAFT = 1;
const STATUS_SUBMITTED = 2;
const STATUS_BEING_PROCESS = 3;
const STATUS_VERIFIED = 4;
const STATUS_APPROVED = 5;
const STATUS_REJECTED = 6;
const STATUS_REJECTED_HOD = 9;
const STATUS_REJECTED_HR = 10;
const HOD_ROLE_ID = 3;
const ADMIN_ROLE_ID = 2;
const APPROVAL_ROLE_ID = 4;
const EDITABLE_STATUSES = new Set(["save_draft", "rejected_hod", "rejected_hr"]);

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

const ACADEMIC_DEPARTMENT_PATTERNS = [
  /PROGRAMME/,
  /\bPROG\b/,
  /BASED DEPT/,
  /RESEARCH/,
  /ACADEMIC SERVICES/,
  /NURSING/,
  /PHARMACY/,
  /PHYSIOTHERAPY/,
  /PSYCHOLOGY/,
  /FOUNDATION IN MEDICAL/,
  /PRE-CLINICAL/,
  /MEDICAL IMAGING/,
  /LABORATORY DEPT/,
];

function resolveStaffDivisionType(division, departmentName) {
  const normalizedDivision = String(division ?? "").trim().toLowerCase();
  if (normalizedDivision.includes("academic")) return "academic";
  if (normalizedDivision.includes("service") || normalizedDivision.includes("corporate")) return "services";

  const department = String(departmentName ?? "").toUpperCase();
  if (ACADEMIC_DEPARTMENT_PATTERNS.some((pattern) => pattern.test(department))) return "academic";
  return "services";
}

function buildDivisionHoursSummary(rows, targetHours) {
  const totals = {
    academic: { staffCount: 0, totalHours: 0 },
    services: { staffCount: 0, totalHours: 0 },
  };

  for (const row of rows) {
    const divisionType = resolveStaffDivisionType(row.division, row.department_name);
    const completedHours = Number(row.completed_hours ?? 0);
    totals[divisionType].staffCount += 1;
    totals[divisionType].totalHours += completedHours;
  }

  return {
    academic: {
      staffCount: totals.academic.staffCount,
      totalHours: totals.academic.totalHours,
      averageHours:
        totals.academic.staffCount > 0
          ? Math.round((totals.academic.totalHours / totals.academic.staffCount) * 10) / 10
          : 0,
      targetHours,
    },
    services: {
      staffCount: totals.services.staffCount,
      totalHours: totals.services.totalHours,
      averageHours:
        totals.services.staffCount > 0
          ? Math.round((totals.services.totalHours / totals.services.staffCount) * 10) / 10
          : 0,
      targetHours,
    },
  };
}

function deriveDepartmentRisk(completionRate) {
  if (completionRate >= 75) return "Low";
  if (completionRate >= 50) return "Moderate";
  return "High";
}

function buildTopDepartments(rows, limit = 5) {
  const departments = rows
    .map((row) => {
      const staffCount = Number(row.staff_count ?? 0);
      const totalHours = Number(row.total_hours ?? 0);
      const compliantCount = Number(row.compliant_count ?? 0);
      const completion = staffCount > 0 ? Math.round((compliantCount / staffCount) * 100) : 0;
      const avgHours = staffCount > 0 ? Math.round((totalHours / staffCount) * 10) / 10 : 0;

      return {
        departmentId: row.department_id,
        departmentName: row.department_name,
        staffCount,
        completion,
        avgHours,
        risk: deriveDepartmentRisk(completion),
      };
    })
    .sort((a, b) => b.completion - a.completion || b.avgHours - a.avgHours || a.departmentName.localeCompare(b.departmentName));

  if (limit == null) return departments;
  return departments.filter((department) => department.staffCount > 0).slice(0, limit);
}

function buildMonthlyTrend(rows) {
  const hoursByMonth = new Map(
    rows.map((row) => [String(row.month_key), Number(row.hours ?? 0)]),
  );
  const months = [];

  for (let offset = 3; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - offset);

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      month: date.toLocaleDateString("en-MY", { month: "short" }),
      monthKey,
      hours: hoursByMonth.get(monthKey) ?? 0,
    });
  }

  return months;
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

function buildDepartmentScope(departmentId) {
  return { clause: "s.department_id = ?", params: [departmentId] };
}

function buildAdminHistoryScope() {
  return { clause: "rs.details <> 'save_draft'", params: [] };
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

function requireAdmin(req, res, next) {
  if (!req.session?.user?.staffId) {
    return res.status(401).json({ error: "Not signed in." });
  }
  if (req.session.user.roleId !== ADMIN_ROLE_ID) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

function requireApproval(req, res, next) {
  if (!req.session?.user?.staffId) {
    return res.status(401).json({ error: "Not signed in." });
  }
  if (req.session.user.roleId !== APPROVAL_ROLE_ID) {
    return res.status(403).json({ error: "Approval access required." });
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

  const [rejectedRows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     INNER JOIN staff s ON s.id = r.submitted_by
     WHERE s.department_id = ?
       AND rs.details = 'rejected_hod'`,
    [departmentId],
  );

  const items = rows.map(mapHodReviewRow);

  return {
    requisitions: items,
    summary: {
      total: items.length,
      pending: items.filter((item) => item.hodStatus === "pending").length,
      recommended: items.filter((item) => item.hodStatus === "recommended").length,
      rejectedByHod: Number(rejectedRows[0]?.cnt ?? 0),
    },
  };
}

function addMonthsToDate(dateStr, months) {
  const [year, month, day] = String(dateStr).split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  return date.toISOString().slice(0, 10);
}

function isHodEvaluationUnlocked(lastProgrammeDate) {
  if (!lastProgrammeDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return addMonthsToDate(lastProgrammeDate, 3) <= today;
}

const HOD_POST_TRAINING_SELECT = `
  SELECT r.id, r.category, r.title, r.venue, r.created_at,
         rs.details AS status,
         s.email AS staff_email,
         d.department_name,
         rd.date_1, rd.time_1, rd.time_to_1,
         rd.date_2, rd.time_2, rd.time_to_2,
         rd.date_3, rd.time_3, rd.time_to_3,
         rd.date_4, rd.time_4, rd.time_to_4,
         rd.date_5, rd.time_5, rd.time_to_5,
         pt.attendance_attached, pt.e_survey_filled, pt.e_survey_responses,
         pt.hod_evaluation_filled, pt.hod_evaluation_responses,
         pt.cpd_points_counted, pt.cpd_points
`;

const HOD_POST_TRAINING_JOINS = `
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN staff s ON s.id = r.submitted_by
  INNER JOIN department_table d ON d.department_id = s.department_id
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN post_training pt ON pt.requisition_id = r.id
`;

function mapHodPostTrainingRow(row) {
  const programmeSlots = extractProgrammeSlotsFromRow(row);
  const programmeDates = programmeSlots.map((slot) => slot.date).filter(Boolean);
  const lastProgrammeDate = programmeDates.length ? programmeDates.reduce((a, b) => (a > b ? a : b)) : null;
  const evaluationDueDate = lastProgrammeDate ? addMonthsToDate(lastProgrammeDate, 3) : null;
  const hodEvaluationFilled = Number(row.hod_evaluation_filled ?? 0) === 1;
  const unlocked = isHodEvaluationUnlocked(lastProgrammeDate);
  const attendanceAttached = Number(row.attendance_attached ?? 0) === 1;
  const eSurveyFilled = Number(row.e_survey_filled ?? 0) === 1;
  const cpdPointsCounted = Number(row.cpd_points_counted ?? 0) === 1;
  const postTrainingSteps = [attendanceAttached, eSurveyFilled, hodEvaluationFilled];
  const postTrainingCompleted = postTrainingSteps.filter(Boolean).length;

  let evaluationStatus = "upcoming";
  if (hodEvaluationFilled) evaluationStatus = "completed";
  else if (unlocked) evaluationStatus = "due";

  return {
    requisitionId: row.id,
    id: `REQ-${String(row.id).padStart(4, "0")}`,
    title: row.title,
    category: row.category,
    venue: row.venue ?? "",
    submittedAt: row.created_at,
    programmeDates,
    programmeSlots,
    lastProgrammeDate,
    evaluationDueDate,
    evaluationStatus,
    staffName: displayNameFromEmail(row.staff_email),
    staffEmail: row.staff_email,
    departmentName: row.department_name ?? null,
    hodEvaluationFilled,
    staffSurveyResponses: parseSurveyResponses(row.e_survey_responses),
    hodEvaluationResponses: parseSurveyResponses(row.hod_evaluation_responses),
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

async function queryHodPostTrainingQueue(pool, departmentId) {
  const [rows] = await pool.execute(
    `${HOD_POST_TRAINING_SELECT}
     ${HOD_POST_TRAINING_JOINS}
     WHERE s.department_id = ?
       AND rs.details = 'approved'
       AND COALESCE(pt.attendance_attached, 0) = 1
       AND COALESCE(pt.e_survey_filled, 0) = 1
     ORDER BY r.updated_at DESC`,
    [departmentId],
  );

  const items = rows.map(mapHodPostTrainingRow);

  return {
    requisitions: items,
    summary: {
      total: items.length,
      due: items.filter((item) => item.evaluationStatus === "due").length,
      upcoming: items.filter((item) => item.evaluationStatus === "upcoming").length,
      completed: items.filter((item) => item.evaluationStatus === "completed").length,
    },
  };
}

async function fetchHodPostTrainingDetail(pool, requisitionId, departmentId) {
  const [rows] = await pool.execute(
    `${HOD_POST_TRAINING_SELECT}
     ${HOD_POST_TRAINING_JOINS}
     WHERE r.id = ? AND s.department_id = ?
     LIMIT 1`,
    [requisitionId, departmentId],
  );
  if (!rows.length) return null;
  const item = mapHodPostTrainingRow(rows[0]);
  if (item.postTraining.attendanceAttached !== true || item.postTraining.eSurveyFilled !== true) {
    return { error: "Staff post-training steps must be complete before HOD evaluation.", status: 400 };
  }
  return item;
}

function validateHodEvaluationBody(body) {
  const errors = [];
  const knowledgeApplied = trimOrEmpty(body?.knowledgeApplied);
  const performanceImpact = trimOrEmpty(body?.performanceImpact);
  const supportsDepartmentGoals = trimOrEmpty(body?.supportsDepartmentGoals);
  const comments = trimOrEmpty(body?.comments);

  if (!["yes", "partially", "no"].includes(knowledgeApplied)) {
    errors.push("Please indicate whether the staff applied knowledge from the programme.");
  }
  if (!["1", "2", "3", "4", "5"].includes(performanceImpact)) {
    errors.push("Please rate the performance impact.");
  }
  if (!["yes", "no"].includes(supportsDepartmentGoals)) {
    errors.push("Please indicate whether this supports department goals.");
  }

  return {
    errors,
    responses: {
      knowledgeApplied,
      performanceImpact,
      supportsDepartmentGoals,
      comments: comments || null,
    },
  };
}

async function submitHodEvaluation(pool, { requisitionId, departmentId, body }) {
  const item = await fetchHodPostTrainingDetail(pool, requisitionId, departmentId);
  if (!item) return { status: 404, error: "Requisition not found in your department." };
  if (item.error) return { status: item.status, error: item.error };
  if (item.hodEvaluationFilled) {
    return { status: 400, error: "HOD evaluation has already been submitted." };
  }
  if (!isHodEvaluationUnlocked(item.lastProgrammeDate)) {
    return {
      status: 400,
      error: `HOD evaluation unlocks 3 months after the programme date${item.evaluationDueDate ? ` (${item.evaluationDueDate})` : ""}.`,
    };
  }

  const { errors, responses } = validateHodEvaluationBody(body);
  if (errors.length) return { status: 400, error: errors.join(" ") };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensurePostTrainingRow(conn, requisitionId);
    await conn.execute(
      `UPDATE post_training SET hod_evaluation_filled = 1, hod_evaluation_responses = ? WHERE requisition_id = ?`,
      [JSON.stringify(responses), requisitionId],
    );
    await maybeCountCpdPoints(conn, requisitionId);
    await conn.commit();
    return { message: "HOD evaluation submitted successfully." };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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

const ADMIN_VERIFY_DETAIL_SELECT = `
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
         doc.path_1, doc.path_2, doc.path_3,
         hod_staff.email AS hod_email,
         hod_al.created_at AS hod_recommended_at,
         hod_al.remarks AS hod_remarks
`;

const ADMIN_VERIFY_DETAIL_JOINS = `
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN staff s ON s.id = r.submitted_by
  INNER JOIN department_table d ON d.department_id = s.department_id
  INNER JOIN budget b ON b.id_budget = r.id_budget
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
  LEFT JOIN requisition_audit_log hod_al ON hod_al.id = (
    SELECT al2.id
    FROM requisition_audit_log al2
    INNER JOIN requisition_status ns ON ns.id = al2.new_status_id
    WHERE al2.requisition_id = r.id AND ns.details = 'being_process'
    ORDER BY al2.created_at DESC
    LIMIT 1
  )
  LEFT JOIN staff hod_staff ON hod_staff.id = hod_al.changed_by
`;

function mapAdminVerifyDocuments(requisitionId, row) {
  return [row.path_1, row.path_2, row.path_3]
    .map((filePath, index) => ({ filePath, index }))
    .filter((entry) => Boolean(entry.filePath))
    .map(({ filePath, index }) => ({
      index,
      name: documentNameFromPath(filePath),
      url: `/api/requisitions/${requisitionId}/admin-documents/${index}`,
    }));
}

function mapAdminVerifyRow(row) {
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
    documents: mapAdminVerifyDocuments(row.id, row),
    hodRecommendation: row.hod_email
      ? {
          name: displayNameFromEmail(row.hod_email),
          email: row.hod_email,
          recommendedAt: row.hod_recommended_at,
          remarks: row.hod_remarks ?? null,
        }
      : null,
  };
}

async function queryAdminRecentSubmissions(pool, pageSize = 5) {
  const scope = buildAdminHistoryScope();

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
             INNER JOIN requisition_status rs_rej ON rs_rej.id = al.new_status_id
             WHERE al.requisition_id = r.id
               AND rs_rej.details IN ('rejected', 'rejected_hod', 'rejected_hr')
             ORDER BY al.created_at DESC
             LIMIT 1) AS rejection_remarks
     ${HISTORY_FROM_JOINS}
     WHERE ${scope.clause}
     ORDER BY r.created_at DESC
     LIMIT ${pageSize}`,
    scope.params,
  );

  return rows.map(mapHistoryRow);
}

async function queryAdminDashboardStats(pool) {
  const [[pendingRows], [verifiedRows], [rejectedRows], [staffRows]] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM requisitions r
       INNER JOIN requisition_status rs ON rs.id = r.status_id
       WHERE rs.details = 'being_process'`,
    ),
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'verified'
         AND old_rs.details = 'being_process'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'rejected_hr'
         AND old_rs.details = 'being_process'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(`SELECT COUNT(*) AS cnt FROM staff`),
  ]);

  return {
    pendingVerification: Number(pendingRows[0]?.cnt ?? 0),
    verifiedThisMonth: Number(verifiedRows[0]?.cnt ?? 0),
    rejectedThisMonth: Number(rejectedRows[0]?.cnt ?? 0),
    totalStaff: Number(staffRows[0]?.cnt ?? 0),
  };
}

const CPD_TARGET_HOURS = 40;

async function queryAdminReportStats(pool) {
  const [
    [totalStaffRows],
    [compliantStaffRows],
    [approvedRows],
    [submittedRows],
    [hoursRows],
    [participantsRows],
    [divisionStaffRows],
    [departmentRows],
    [monthlyTrendRows],
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS cnt FROM staff`),
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM staff s
       LEFT JOIN (
         SELECT r2.submitted_by AS staff_id,
                SUM(COALESCE(pt.cpd_points, 0)) AS completed_hours
         FROM requisitions r2
         INNER JOIN post_training pt ON pt.requisition_id = r2.id AND pt.cpd_points_counted = 1
         GROUP BY r2.submitted_by
       ) cpd ON cpd.staff_id = s.id
       WHERE COALESCE(cpd.completed_hours, 0) >= ?`,
      [CPD_TARGET_HOURS],
    ),
    pool.execute(
      `SELECT COUNT(DISTINCT al.requisition_id) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'approved'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM requisitions r
       INNER JOIN requisition_status rs ON rs.id = r.status_id
       WHERE rs.details <> 'save_draft'
         AND YEAR(r.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(r.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(
      `SELECT COALESCE(SUM(pt.cpd_points), 0) AS total_hours
       FROM post_training pt
       WHERE pt.cpd_points_counted = 1`,
    ),
    pool.execute(
      `SELECT COUNT(DISTINCT r.submitted_by) AS cnt
       FROM requisitions r
       INNER JOIN requisition_status rs ON rs.id = r.status_id
       INNER JOIN requisition_date rd ON rd.id_date = r.id_date
       WHERE rs.details = 'approved'
         AND (
           DATE_FORMAT(rd.date_1, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
           OR DATE_FORMAT(rd.date_2, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
           OR DATE_FORMAT(rd.date_3, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
           OR DATE_FORMAT(rd.date_4, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
           OR DATE_FORMAT(rd.date_5, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
         )`,
    ),
    pool.execute(
      `SELECT s.division, d.department_name,
              COALESCE(cpd.completed_hours, 0) AS completed_hours
       FROM staff s
       INNER JOIN department_table d ON d.department_id = s.department_id
       LEFT JOIN (
         SELECT r2.submitted_by AS staff_id,
                SUM(COALESCE(pt.cpd_points, 0)) AS completed_hours
         FROM requisitions r2
         INNER JOIN post_training pt ON pt.requisition_id = r2.id AND pt.cpd_points_counted = 1
         GROUP BY r2.submitted_by
       ) cpd ON cpd.staff_id = s.id`,
    ),
    pool.execute(
      `SELECT d.department_id, d.department_name,
              COUNT(s.id) AS staff_count,
              COALESCE(SUM(cpd.completed_hours), 0) AS total_hours,
              SUM(CASE WHEN COALESCE(cpd.completed_hours, 0) >= ? THEN 1 ELSE 0 END) AS compliant_count
       FROM department_table d
       LEFT JOIN staff s ON s.department_id = d.department_id
       LEFT JOIN (
         SELECT r2.submitted_by AS staff_id,
                SUM(COALESCE(pt.cpd_points, 0)) AS completed_hours
         FROM requisitions r2
         INNER JOIN post_training pt ON pt.requisition_id = r2.id AND pt.cpd_points_counted = 1
         GROUP BY r2.submitted_by
       ) cpd ON cpd.staff_id = s.id
       GROUP BY d.department_id, d.department_name`,
      [CPD_TARGET_HOURS],
    ),
    pool.execute(
      `SELECT DATE_FORMAT(pt.updated_at, '%Y-%m') AS month_key,
              COALESCE(SUM(pt.cpd_points), 0) AS hours
       FROM post_training pt
       WHERE pt.cpd_points_counted = 1
         AND pt.updated_at >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
       GROUP BY month_key
       ORDER BY month_key`,
    ),
  ]);

  const totalStaff = Number(totalStaffRows[0]?.cnt ?? 0);
  const compliantStaff = Number(compliantStaffRows[0]?.cnt ?? 0);
  const approvedRequisitionsThisMonth = Number(approvedRows[0]?.cnt ?? 0);
  const submittedRequisitionsThisMonth = Number(submittedRows[0]?.cnt ?? 0);
  const totalTrainingHours = Number(hoursRows[0]?.total_hours ?? 0);
  const participantsThisMonth = Number(participantsRows[0]?.cnt ?? 0);
  const divisionHours = buildDivisionHoursSummary(divisionStaffRows, CPD_TARGET_HOURS);
  const departments = buildTopDepartments(departmentRows, null);
  const topDepartments = departments.filter((department) => department.staffCount > 0).slice(0, 5);
  const monthlyTrend = buildMonthlyTrend(monthlyTrendRows);

  return {
    totalStaff,
    compliantStaff,
    cpdTargetHours: CPD_TARGET_HOURS,
    approvedRequisitionsThisMonth,
    submittedRequisitionsThisMonth,
    totalTrainingHours,
    participantsThisMonth,
    divisionHours,
    departments,
    topDepartments,
    monthlyTrend,
  };
}

async function queryAdminVerifyQueue(pool) {
  const [rows] = await pool.execute(
    `${ADMIN_VERIFY_DETAIL_SELECT}
     ${ADMIN_VERIFY_DETAIL_JOINS}
     WHERE rs.details = 'being_process'
     ORDER BY hod_al.created_at DESC, r.created_at DESC`,
  );

  const items = rows.map(mapAdminVerifyRow);

  return {
    requisitions: items,
    summary: {
      total: items.length,
    },
  };
}

async function queryAdminVerifyDetail(pool, requisitionId) {
  const [rows] = await pool.execute(
    `${ADMIN_VERIFY_DETAIL_SELECT}
     ${ADMIN_VERIFY_DETAIL_JOINS}
     WHERE r.id = ?
       AND rs.details = 'being_process'
     LIMIT 1`,
    [requisitionId],
  );

  const row = rows[0];
  if (!row) return null;
  return mapAdminVerifyRow(row);
}

async function fetchAdminRequisitionDocumentPath(pool, requisitionId, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return null;

  const [rows] = await pool.execute(
    `SELECT doc.path_1, doc.path_2, doc.path_3
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
     WHERE r.id = ?
       AND rs.details = 'being_process'
     LIMIT 1`,
    [requisitionId],
  );

  const row = rows[0];
  if (!row) return null;

  const paths = [row.path_1, row.path_2, row.path_3];
  const relativePath = paths[slotIndex];
  if (!relativePath) return null;

  return resolveUploadPath(relativePath);
}

async function fetchRequisitionForAdminVerify(pool, requisitionId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.status_id, rs.details AS status
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     WHERE r.id = ?
     LIMIT 1`,
    [requisitionId],
  );
  return rows[0] ?? null;
}

async function adminVerifyRequisition(pool, { requisitionId, reviewerStaffId, decision, remarks }) {
  const row = await fetchRequisitionForAdminVerify(pool, requisitionId);
  if (!row) {
    return { error: "Requisition not found.", status: 404 };
  }

  if (row.status !== "being_process") {
    return {
      error:
        row.status === "verified"
          ? "This requisition has already been verified."
          : "Only HOD-recommended requisitions can be verified.",
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

  const newStatusId = decision === "reject" ? STATUS_REJECTED_HR : STATUS_VERIFIED;
  const newStatus = decision === "reject" ? "rejected_hr" : "verified";
  const auditRemarks =
    decision === "reject" ? trimmedRemarks : trimmedRemarks || "Verified by admin";

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

const APPROVAL_DETAIL_SELECT = `
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
         doc.path_1, doc.path_2, doc.path_3,
         hod_staff.email AS hod_email,
         hod_al.created_at AS hod_recommended_at,
         hod_al.remarks AS hod_remarks,
         hr_staff.email AS hr_email,
         hr_al.created_at AS hr_verified_at,
         hr_al.remarks AS hr_remarks
`;

const APPROVAL_DETAIL_JOINS = `
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN staff s ON s.id = r.submitted_by
  INNER JOIN department_table d ON d.department_id = s.department_id
  INNER JOIN budget b ON b.id_budget = r.id_budget
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
  LEFT JOIN requisition_audit_log hod_al ON hod_al.id = (
    SELECT al2.id
    FROM requisition_audit_log al2
    INNER JOIN requisition_status ns ON ns.id = al2.new_status_id
    WHERE al2.requisition_id = r.id AND ns.details = 'being_process'
    ORDER BY al2.created_at DESC
    LIMIT 1
  )
  LEFT JOIN staff hod_staff ON hod_staff.id = hod_al.changed_by
  LEFT JOIN requisition_audit_log hr_al ON hr_al.id = (
    SELECT al3.id
    FROM requisition_audit_log al3
    INNER JOIN requisition_status ns2 ON ns2.id = al3.new_status_id
    WHERE al3.requisition_id = r.id AND ns2.details = 'verified'
    ORDER BY al3.created_at DESC
    LIMIT 1
  )
  LEFT JOIN staff hr_staff ON hr_staff.id = hr_al.changed_by
`;

function mapApprovalDocuments(requisitionId, row) {
  return [row.path_1, row.path_2, row.path_3]
    .map((filePath, index) => ({ filePath, index }))
    .filter((entry) => Boolean(entry.filePath))
    .map(({ filePath, index }) => ({
      index,
      name: documentNameFromPath(filePath),
      url: `/api/requisitions/${requisitionId}/approval-documents/${index}`,
    }));
}

function mapApprovalRow(row) {
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
    documents: mapApprovalDocuments(row.id, row),
    hodRecommendation: row.hod_email
      ? {
          name: displayNameFromEmail(row.hod_email),
          email: row.hod_email,
          recommendedAt: row.hod_recommended_at,
          remarks: row.hod_remarks ?? null,
        }
      : null,
    hrVerification: row.hr_email
      ? {
          name: displayNameFromEmail(row.hr_email),
          email: row.hr_email,
          verifiedAt: row.hr_verified_at,
          remarks: row.hr_remarks ?? null,
        }
      : null,
  };
}

async function queryApprovalQueue(pool) {
  const [rows] = await pool.execute(
    `${APPROVAL_DETAIL_SELECT}
     ${APPROVAL_DETAIL_JOINS}
     WHERE rs.details = 'verified'
     ORDER BY hr_al.created_at DESC, r.created_at DESC`,
  );

  const items = rows.map(mapApprovalRow);

  return {
    requisitions: items,
    summary: {
      total: items.length,
    },
  };
}

async function queryApprovalDashboardStats(pool) {
  const [[pendingRows], [approvedRows], [rejectedRows], [verifiedRows]] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM requisitions r
       INNER JOIN requisition_status rs ON rs.id = r.status_id
       WHERE rs.details = 'verified'`,
    ),
    pool.execute(
      `SELECT COUNT(DISTINCT al.requisition_id) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'approved'
         AND old_rs.details = 'verified'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(
      `SELECT COUNT(DISTINCT al.requisition_id) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'rejected'
         AND old_rs.details = 'verified'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
    pool.execute(
      `SELECT COUNT(DISTINCT al.requisition_id) AS cnt
       FROM requisition_audit_log al
       INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
       INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
       WHERE new_rs.details = 'verified'
         AND old_rs.details = 'being_process'
         AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
         AND MONTH(al.created_at) = MONTH(CURRENT_DATE())`,
    ),
  ]);

  return {
    pendingApproval: Number(pendingRows[0]?.cnt ?? 0),
    approvedThisMonth: Number(approvedRows[0]?.cnt ?? 0),
    rejectedThisMonth: Number(rejectedRows[0]?.cnt ?? 0),
    verifiedThisMonth: Number(verifiedRows[0]?.cnt ?? 0),
  };
}

function buildApprovalDashboardItemsFilter(view) {
  switch (view) {
    case "approved":
      return {
        clause: `r.id IN (
          SELECT DISTINCT al.requisition_id
          FROM requisition_audit_log al
          INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
          INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
          WHERE new_rs.details = 'approved'
            AND old_rs.details = 'verified'
            AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
            AND MONTH(al.created_at) = MONTH(CURRENT_DATE())
        )`,
        orderBy: "r.updated_at DESC, r.created_at DESC",
      };
    case "rejected":
      return {
        clause: `r.id IN (
          SELECT DISTINCT al.requisition_id
          FROM requisition_audit_log al
          INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
          INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
          WHERE new_rs.details = 'rejected'
            AND old_rs.details = 'verified'
            AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
            AND MONTH(al.created_at) = MONTH(CURRENT_DATE())
        )`,
        orderBy: "r.updated_at DESC, r.created_at DESC",
      };
    case "verified":
      return {
        clause: `r.id IN (
          SELECT DISTINCT al.requisition_id
          FROM requisition_audit_log al
          INNER JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
          INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
          WHERE new_rs.details = 'verified'
            AND old_rs.details = 'being_process'
            AND YEAR(al.created_at) = YEAR(CURRENT_DATE())
            AND MONTH(al.created_at) = MONTH(CURRENT_DATE())
        )`,
        orderBy: "hr_al.created_at DESC, r.created_at DESC",
      };
    case "pending":
    default:
      return {
        clause: "rs.details = 'verified'",
        orderBy: "hr_al.created_at DESC, r.created_at DESC",
      };
  }
}

async function queryApprovalDashboardItems(pool, view) {
  const filter = buildApprovalDashboardItemsFilter(view);
  const [rows] = await pool.execute(
    `${APPROVAL_DETAIL_SELECT}
     ${APPROVAL_DETAIL_JOINS}
     WHERE ${filter.clause}
     ORDER BY ${filter.orderBy}`,
  );

  return {
    requisitions: rows.map(mapApprovalRow),
  };
}

async function queryApprovalDetail(pool, requisitionId) {
  const [rows] = await pool.execute(
    `${APPROVAL_DETAIL_SELECT}
     ${APPROVAL_DETAIL_JOINS}
     WHERE r.id = ?
       AND rs.details = 'verified'
     LIMIT 1`,
    [requisitionId],
  );

  const row = rows[0];
  if (!row) return null;
  return mapApprovalRow(row);
}

async function fetchApprovalRequisitionDocumentPath(pool, requisitionId, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return null;

  const [rows] = await pool.execute(
    `SELECT doc.path_1, doc.path_2, doc.path_3
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     LEFT JOIN requisition_documents doc ON doc.id_documents = r.id_documents
     WHERE r.id = ?
       AND rs.details = 'verified'
     LIMIT 1`,
    [requisitionId],
  );

  const row = rows[0];
  if (!row) return null;

  const paths = [row.path_1, row.path_2, row.path_3];
  const relativePath = paths[slotIndex];
  if (!relativePath) return null;

  return resolveUploadPath(relativePath);
}

async function fetchRequisitionForApproval(pool, requisitionId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.status_id, rs.details AS status
     FROM requisitions r
     INNER JOIN requisition_status rs ON rs.id = r.status_id
     WHERE r.id = ?
     LIMIT 1`,
    [requisitionId],
  );
  return rows[0] ?? null;
}

async function approvalDecideRequisition(pool, { requisitionId, reviewerStaffId, decision, remarks }) {
  const row = await fetchRequisitionForApproval(pool, requisitionId);
  if (!row) {
    return { error: "Requisition not found.", status: 404 };
  }

  if (row.status !== "verified") {
    return {
      error:
        row.status === "approved"
          ? "This requisition has already been approved."
          : "Only HR-verified requisitions can be approved or rejected.",
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

  const newStatusId = decision === "reject" ? STATUS_REJECTED : STATUS_APPROVED;
  const newStatus = decision === "reject" ? "rejected" : "approved";
  const auditRemarks =
    decision === "reject" ? trimmedRemarks : trimmedRemarks || "Approved by dean";

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

  const programmeSlots = extractProgrammeSlotsFromRow(row);
  const programmeDates = programmeSlots.map((slot) => slot.date);
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
    programmeSlots,
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
             INNER JOIN requisition_status rs_rej ON rs_rej.id = al.new_status_id
             WHERE al.requisition_id = r.id
               AND rs_rej.details IN ('rejected', 'rejected_hod', 'rejected_hr')
             ORDER BY al.created_at DESC
             LIMIT 1) AS rejection_remarks
     ${HISTORY_FROM_JOINS}
     WHERE ${whereSql}
     ORDER BY r.updated_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    whereParams,
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

async function queryDepartmentHistorySummary(pool, departmentId) {
  const scope = buildDepartmentScope(departmentId);
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

async function queryDepartmentRequisitionHistory(pool, { departmentId, phaseFilter, page, pageSize }) {
  const scope = buildDepartmentScope(departmentId);
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
             INNER JOIN requisition_status rs_rej ON rs_rej.id = al.new_status_id
             WHERE al.requisition_id = r.id
               AND rs_rej.details IN ('rejected', 'rejected_hod', 'rejected_hr')
             ORDER BY al.created_at DESC
             LIMIT 1) AS rejection_remarks
     ${HISTORY_FROM_JOINS}
     WHERE ${whereSql}
     ORDER BY r.updated_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    whereParams,
  );

  const summary = await queryDepartmentHistorySummary(pool, departmentId);

  return {
    requisitions: rows.map(mapHistoryRow),
    total,
    page: safePage,
    pageSize,
    totalPages,
    summary,
  };
}

function mapAuditLogRow(row) {
  return {
    logId: row.id,
    requisitionId: row.requisition_id,
    requisitionTitle: row.title,
    venue: row.venue,
    submittedAt: row.submitted_at,
    changedAt: row.created_at,
    oldStatus: row.old_status ?? null,
    newStatus: row.new_status,
    remarks: row.remarks ?? null,
    changedByName: displayNameFromEmail(row.changed_by_email),
    changedByEmail: row.changed_by_email,
  };
}

async function queryRequisitionAuditLogs(pool, { user, page, pageSize }) {
  const scope = buildHistoryScope(user);

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM requisition_audit_log al
     INNER JOIN requisitions r ON r.id = al.requisition_id
     WHERE ${scope.clause}`,
    scope.params,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const [rows] = await pool.execute(
    `SELECT al.id, al.requisition_id, al.created_at, al.remarks,
            r.title, r.venue, r.created_at AS submitted_at,
            old_rs.details AS old_status,
            new_rs.details AS new_status,
            changer.email AS changed_by_email
     FROM requisition_audit_log al
     INNER JOIN requisitions r ON r.id = al.requisition_id
     LEFT JOIN requisition_status old_rs ON old_rs.id = al.old_status_id
     INNER JOIN requisition_status new_rs ON new_rs.id = al.new_status_id
     INNER JOIN staff changer ON changer.id = al.changed_by
     WHERE ${scope.clause}
     ORDER BY al.created_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    scope.params,
  );

  return {
    logs: rows.map(mapAuditLogRow),
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

const postTrainingUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, postTrainingUploadsDir),
    filename: (req, file, cb) => {
      const requisitionId = parsePositiveInt(req.params.requisitionId) ?? "unknown";
      const ext = path.extname(file.originalname ?? "").toLowerCase() || ".bin";
      const safeExt = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? ext : ".bin";
      cb(null, `req-${requisitionId}-attendance${safeExt}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
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

function existingDocumentPaths(row) {
  return [row.path_1, row.path_2, row.path_3].filter(Boolean);
}

function normalizeKeptDocuments(keptDocuments, existingPaths) {
  if (!Array.isArray(keptDocuments)) {
    return existingPaths;
  }
  const allowed = new Set(existingPaths);
  return keptDocuments.filter((docPath) => allowed.has(docPath));
}

function deleteUploadFile(relativePath) {
  const absPath = resolveUploadPath(relativePath);
  if (!absPath) return;
  try {
    fs.unlinkSync(absPath);
  } catch {
    /* ignore */
  }
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
  if (existing.status === "rejected_hr" && statusId === STATUS_SAVE_DRAFT) {
    statusId = STATUS_REJECTED_HR;
  }
  if (existing.status === "rejected_hr" && statusId === STATUS_SUBMITTED) {
    statusId = STATUS_BEING_PROCESS;
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
  const existingPaths = existingDocumentPaths(existing);
  const keptDocuments = normalizeKeptDocuments(body?.keptDocuments, existingPaths);
  const newDocPaths = documentPathsFromFiles(files);
  const finalDocPaths = [...keptDocuments, ...newDocPaths];

  if (finalDocPaths.length > 3) {
    for (const file of files ?? []) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
    }
    return { error: "A maximum of 3 documents is allowed.", status: 400 };
  }

  const removedPaths = existingPaths.filter((docPath) => !keptDocuments.includes(docPath));
  for (const docPath of removedPaths) {
    deleteUploadFile(docPath);
  }

  const docPaths = finalDocPaths;

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
    if (idDocuments) {
      await conn.execute(
        `UPDATE requisition_documents SET path_1 = ?, path_2 = ?, path_3 = ? WHERE id_documents = ?`,
        [docPaths[0] ?? null, docPaths[1] ?? null, docPaths[2] ?? null, idDocuments],
      );
    } else if (docPaths.length > 0) {
      const [docResult] = await conn.execute(
        `INSERT INTO requisition_documents (path_1, path_2, path_3) VALUES (?, ?, ?)`,
        [docPaths[0] ?? null, docPaths[1] ?? null, docPaths[2] ?? null],
      );
      idDocuments = docResult.insertId;
    }

    const resubmittingHod = existing.status === "rejected_hod" && statusId === STATUS_SUBMITTED;
    const resubmittingHr = existing.status === "rejected_hr" && statusId === STATUS_BEING_PROCESS;
    const resubmitting = resubmittingHod || resubmittingHr;

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
        resubmittingHod ? 1 : 0,
        requisitionId,
      ],
    );

    if (statusId !== existing.status_id) {
      const auditRemarks = resubmittingHod
        ? "Resubmitted after HOD rejection"
        : resubmittingHr
          ? "Resubmitted after HR rejection"
          : null;
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
  if (existing.status !== "rejected_hod" && existing.status !== "rejected_hr") {
    return { error: "Only rejected requisitions can be resubmitted.", status: 400 };
  }

  const resubmittingHr = existing.status === "rejected_hr";
  const nextStatusId = resubmittingHr ? STATUS_BEING_PROCESS : STATUS_SUBMITTED;
  const nextStatus = resubmittingHr ? "being_process" : "submitted";
  const auditRemarks = resubmittingHr ? "Resubmitted after HR rejection" : "Resubmitted after HOD rejection";

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE requisitions SET status_id = ?, recommended_by = CASE WHEN ? THEN recommended_by ELSE NULL END WHERE id = ?`,
      [nextStatusId, resubmittingHr ? 1 : 0, requisitionId],
    );

    await conn.execute(
      `INSERT INTO requisition_audit_log (requisition_id, changed_by, old_status_id, new_status_id, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [requisitionId, staffId, existing.status_id, nextStatusId, auditRemarks],
    );

    await conn.commit();
    return { requisitionId, statusId: nextStatusId, status: nextStatus, resubmittingHr };
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

const POST_TRAINING_DETAIL_SELECT = `
  SELECT r.id, r.title, r.category, r.venue, r.created_at, r.updated_at,
         rs.details AS status,
         rd.date_1, rd.time_1, rd.time_to_1,
         rd.date_2, rd.time_2, rd.time_to_2,
         rd.date_3, rd.time_3, rd.time_to_3,
         rd.date_4, rd.time_4, rd.time_to_4,
         rd.date_5, rd.time_5, rd.time_to_5,
         pt.attendance_attached, pt.attendance_path, pt.e_survey_filled, pt.e_survey_responses,
         pt.hod_evaluation_filled, pt.cpd_points_counted, pt.cpd_points
  FROM requisitions r
  INNER JOIN requisition_status rs ON rs.id = r.status_id
  INNER JOIN requisition_date rd ON rd.id_date = r.id_date
  LEFT JOIN post_training pt ON pt.requisition_id = r.id
`;

async function ensurePostTrainingRow(conn, requisitionId) {
  const [rows] = await conn.execute(`SELECT id FROM post_training WHERE requisition_id = ?`, [requisitionId]);
  if (!rows.length) {
    await conn.execute(`INSERT INTO post_training (requisition_id) VALUES (?)`, [requisitionId]);
  }
}

async function maybeCountCpdPoints(conn, requisitionId) {
  const [rows] = await conn.execute(
    `SELECT attendance_attached, e_survey_filled, hod_evaluation_filled, cpd_points_counted
     FROM post_training WHERE requisition_id = ?`,
    [requisitionId],
  );
  const row = rows[0];
  if (!row || Number(row.cpd_points_counted ?? 0) === 1) return;
  const complete =
    Number(row.attendance_attached ?? 0) === 1 &&
    Number(row.e_survey_filled ?? 0) === 1 &&
    Number(row.hod_evaluation_filled ?? 0) === 1;
  if (!complete) return;
  await conn.execute(
    `UPDATE post_training SET cpd_points_counted = 1, cpd_points = COALESCE(cpd_points, 0) WHERE requisition_id = ?`,
    [requisitionId],
  );
}

function parseSurveyResponses(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function mapPostTrainingDetail(row) {
  const programmeSlots = extractProgrammeSlotsFromRow(row);
  const programmeDates = programmeSlots.map((slot) => slot.date);
  const workflowPhase = deriveWorkflowPhase(row.status, row);
  const dates = collectProgrammeDates(row);
  const lastDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  const today = new Date().toISOString().slice(0, 10);
  const programmeStarted = lastDate != null && lastDate <= today;

  const attendanceAttached = Number(row.attendance_attached ?? 0) === 1;
  const eSurveyFilled = Number(row.e_survey_filled ?? 0) === 1;
  const hodEvaluationFilled = Number(row.hod_evaluation_filled ?? 0) === 1;
  const cpdPointsCounted = Number(row.cpd_points_counted ?? 0) === 1;
  const postTrainingSteps = [attendanceAttached, eSurveyFilled, hodEvaluationFilled];
  const postTrainingCompleted = postTrainingSteps.filter(Boolean).length;
  const attendancePath = row.attendance_path ? String(row.attendance_path) : null;

  return {
    requisitionId: row.id,
    id: `REQ-${String(row.id).padStart(4, "0")}`,
    title: row.title,
    category: row.category,
    venue: row.venue ?? "",
    programmeSlots,
    programmeDates,
    workflowPhase,
    locked: row.status === "approved" && !programmeStarted,
    postTraining: {
      attendanceAttached,
      eSurveyFilled,
      hodEvaluationFilled,
      cpdPointsCounted,
      cpdPoints: row.cpd_points != null ? Number(row.cpd_points) : null,
      completedSteps: postTrainingCompleted,
      totalSteps: 3,
      isComplete: cpdPointsCounted || postTrainingCompleted === 3,
      attendanceFileName: attendancePath ? path.basename(attendancePath) : null,
      eSurveyResponses: parseSurveyResponses(row.e_survey_responses),
    },
  };
}

async function fetchStaffPostTrainingDetail(pool, requisitionId, staffId) {
  const [rows] = await pool.execute(
    `${POST_TRAINING_DETAIL_SELECT} WHERE r.id = ? AND r.submitted_by = ?`,
    [requisitionId, staffId],
  );
  if (!rows.length) return null;
  const row = rows[0];
  if (row.status !== "approved") {
    return { error: "Post-training is only available for approved requisitions.", status: 400 };
  }
  return { detail: mapPostTrainingDetail(row) };
}

function validateESurveyBody(body) {
  const errors = [];
  const objectivesMet = trimOrEmpty(body?.objectivesMet);
  const satisfaction = trimOrEmpty(body?.satisfaction);
  const wouldRecommend = trimOrEmpty(body?.wouldRecommend);
  const comments = trimOrEmpty(body?.comments);

  if (!["yes", "partially", "no"].includes(objectivesMet)) {
    errors.push("Please indicate whether the programme met its objectives.");
  }
  if (!["1", "2", "3", "4", "5"].includes(satisfaction)) {
    errors.push("Please rate your overall satisfaction.");
  }
  if (!["yes", "no"].includes(wouldRecommend)) {
    errors.push("Please indicate whether you would recommend this programme.");
  }

  return {
    errors,
    responses: {
      objectivesMet,
      satisfaction,
      wouldRecommend,
      comments: comments || null,
    },
  };
}

async function submitPostTrainingSurvey(pool, { requisitionId, staffId, body }) {
  const context = await fetchStaffPostTrainingDetail(pool, requisitionId, staffId);
  if (!context) return { status: 404, error: "Requisition not found." };
  if (context.error) return { status: context.status, error: context.error };
  if (context.detail.locked) {
    return { status: 400, error: "Post-training unlocks on or after the programme date." };
  }
  if (!context.detail.postTraining.attendanceAttached) {
    return { status: 400, error: "Upload attendance evidence before submitting the e-survey." };
  }
  if (context.detail.postTraining.eSurveyFilled) {
    return { status: 400, error: "E-survey has already been submitted." };
  }

  const { errors, responses } = validateESurveyBody(body);
  if (errors.length) return { status: 400, error: errors.join(" ") };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensurePostTrainingRow(conn, requisitionId);
    await conn.execute(
      `UPDATE post_training SET e_survey_filled = 1, e_survey_responses = ? WHERE requisition_id = ?`,
      [JSON.stringify(responses), requisitionId],
    );
    await maybeCountCpdPoints(conn, requisitionId);
    await conn.commit();
    return { message: "E-survey submitted successfully." };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function submitPostTrainingAttendance(pool, { requisitionId, staffId, file }) {
  const context = await fetchStaffPostTrainingDetail(pool, requisitionId, staffId);
  if (!context) return { status: 404, error: "Requisition not found." };
  if (context.error) return { status: context.status, error: context.error };
  if (context.detail.locked) {
    return { status: 400, error: "Post-training unlocks on or after the programme date." };
  }
  if (context.detail.postTraining.attendanceAttached) {
    return { status: 400, error: "Attendance evidence has already been uploaded." };
  }
  if (!file) return { status: 400, error: "Attendance file is required." };

  const relativePath = path.join("post-training", path.basename(file.path));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensurePostTrainingRow(conn, requisitionId);
    await conn.execute(
      `UPDATE post_training SET attendance_attached = 1, attendance_path = ? WHERE requisition_id = ?`,
      [relativePath, requisitionId],
    );
    await maybeCountCpdPoints(conn, requisitionId);
    await conn.commit();
    return { message: "Attendance evidence uploaded successfully." };
  } catch (err) {
    await conn.rollback();
    try {
      fs.unlinkSync(file.path);
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function fetchStaffAttendanceFilePath(pool, requisitionId, staffId) {
  const [rows] = await pool.execute(
    `SELECT pt.attendance_path
     FROM post_training pt
     INNER JOIN requisitions r ON r.id = pt.requisition_id
     WHERE pt.requisition_id = ? AND r.submitted_by = ? AND pt.attendance_attached = 1`,
    [requisitionId, staffId],
  );
  const attendancePath = rows[0]?.attendance_path;
  if (!attendancePath) return null;
  const uploadsRoot = path.resolve(path.join(__dirname, "..", "uploads"));
  const resolved = path.resolve(uploadsRoot, String(attendancePath));
  if (!resolved.startsWith(uploadsRoot + path.sep)) return null;
  return resolved;
}

async function removePostTrainingAttendance(pool, { requisitionId, staffId }) {
  const context = await fetchStaffPostTrainingDetail(pool, requisitionId, staffId);
  if (!context) return { status: 404, error: "Requisition not found." };
  if (context.error) return { status: context.status, error: context.error };
  if (context.detail.locked) {
    return { status: 400, error: "Post-training unlocks on or after the programme date." };
  }
  if (!context.detail.postTraining.attendanceAttached) {
    return { status: 400, error: "No attendance evidence to remove." };
  }
  if (context.detail.postTraining.eSurveyFilled) {
    return { status: 400, error: "Cannot remove evidence after the e-survey has been submitted." };
  }

  const filePath = await fetchStaffAttendanceFilePath(pool, requisitionId, staffId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE post_training
       SET attendance_attached = 0, attendance_path = NULL, cpd_points_counted = 0
       WHERE requisition_id = ?`,
      [requisitionId],
    );
    await conn.commit();
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }
    return { message: "Attendance evidence removed." };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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

  apiRouter.get("/requisitions/logs", generalLimiter, requireAuth, async (req, res) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 20) ?? 20, 100);

      const result = await queryRequisitionAuditLogs(pool, {
        user: req.session.user,
        page,
        pageSize,
      });

      return res.json(result);
    } catch (err) {
      console.error("Requisition logs error:", err);
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

  apiRouter.get("/requisitions/hod/history", generalLimiter, requireHod, async (req, res) => {
    try {
      const page = parsePositiveInt(req.query.page, 1);
      const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10) ?? 10, 100);
      const phaseFilter = String(req.query.phase ?? req.query.status ?? "all").trim().toLowerCase();

      const result = await queryDepartmentRequisitionHistory(pool, {
        departmentId: req.session.user.departmentId,
        phaseFilter,
        page,
        pageSize,
      });

      return res.json(result);
    } catch (err) {
      console.error("HOD department history error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/hod/post-training-queue", generalLimiter, requireHod, async (req, res) => {
    try {
      const result = await queryHodPostTrainingQueue(pool, req.session.user.departmentId);
      return res.json(result);
    } catch (err) {
      console.error("HOD post-training queue error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

function deriveCpdTrackStatus(completedHours, activeRequisitions = 0) {
  const target = 40;
  const percent = target ? (Number(completedHours) / target) * 100 : 0;
  if (percent >= 50) return "on-track";
  if (percent < 25 && activeRequisitions === 0) return "off-track";
  if (percent < 50 || activeRequisitions > 0) return "need-attention";
  return "on-track";
}

  apiRouter.get("/requisitions/hod/department-staff", generalLimiter, requireHod, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.email, s.role_id, r.role_name,
                COALESCE(cpd.completed_hours, 0) AS cpd_completed_hours,
                COALESCE(active.active_count, 0) AS active_requisitions
         FROM staff s
         INNER JOIN role_table r ON r.role_id = s.role_id
         LEFT JOIN (
           SELECT r2.submitted_by AS staff_id,
                  SUM(COALESCE(pt.cpd_points, 0)) AS completed_hours
           FROM requisitions r2
           INNER JOIN post_training pt ON pt.requisition_id = r2.id AND pt.cpd_points_counted = 1
           GROUP BY r2.submitted_by
         ) cpd ON cpd.staff_id = s.id
         LEFT JOIN (
           SELECT r3.submitted_by AS staff_id, COUNT(*) AS active_count
           FROM requisitions r3
           INNER JOIN requisition_status rs ON rs.id = r3.status_id
           WHERE rs.details IN ('submitted', 'being_process', 'verified', 'approved')
           GROUP BY r3.submitted_by
         ) active ON active.staff_id = s.id
         WHERE s.department_id = ?
         ORDER BY s.email`,
        [req.session.user.departmentId],
      );

      return res.json({
        departmentId: req.session.user.departmentId,
        departmentName: req.session.user.departmentName,
        staff: rows.map((row) => {
          const cpdCompletedHours = Number(row.cpd_completed_hours ?? 0);
          const activeRequisitions = Number(row.active_requisitions ?? 0);
          return {
            staffId: row.id,
            fullName: displayNameFromEmail(row.email),
            email: row.email,
            roleId: row.role_id,
            roleName: row.role_name,
            cpdCompletedHours,
            cpdTargetHours: 40,
            trackStatus: deriveCpdTrackStatus(cpdCompletedHours, activeRequisitions),
          };
        }),
      });
    } catch (err) {
      console.error("HOD department staff error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/:requisitionId/hod-evaluation", generalLimiter, requireHod, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const detail = await fetchHodPostTrainingDetail(pool, requisitionId, req.session.user.departmentId);
      if (!detail) {
        return res.status(404).json({ error: "Requisition not found in your department." });
      }
      if (detail.error) {
        return res.status(detail.status).json({ error: detail.error });
      }
      return res.json(detail);
    } catch (err) {
      console.error("HOD evaluation detail error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.post("/requisitions/:requisitionId/hod-evaluation", generalLimiter, requireHod, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const result = await submitHodEvaluation(pool, {
        requisitionId,
        departmentId: req.session.user.departmentId,
        body: req.body,
      });
      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.json({ message: result.message });
    } catch (err) {
      console.error("HOD evaluation submit error:", err);
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

  apiRouter.get("/requisitions/admin/dashboard-stats", generalLimiter, requireAdmin, async (req, res) => {
    try {
      const result = await queryAdminDashboardStats(pool);
      return res.json(result);
    } catch (err) {
      console.error("Admin dashboard stats error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/admin/recent-submissions", generalLimiter, requireAdmin, async (req, res) => {
    try {
      const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 5) ?? 5, 20);
      const requisitions = await queryAdminRecentSubmissions(pool, pageSize);
      return res.json({ requisitions });
    } catch (err) {
      console.error("Admin recent submissions error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/admin/report-stats", generalLimiter, requireAdmin, async (req, res) => {
    try {
      const result = await queryAdminReportStats(pool);
      return res.json(result);
    } catch (err) {
      console.error("Admin report stats error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/admin/verify-queue", generalLimiter, requireAdmin, async (req, res) => {
    try {
      const result = await queryAdminVerifyQueue(pool);
      return res.json(result);
    } catch (err) {
      console.error("Admin verify queue error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/:requisitionId/admin-verify", generalLimiter, requireAdmin, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const detail = await queryAdminVerifyDetail(pool, requisitionId);
      if (!detail) {
        return res.status(404).json({ error: "Requisition not found in the verify queue." });
      }
      return res.json(detail);
    } catch (err) {
      console.error("Admin verify detail error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get(
    "/requisitions/:requisitionId/admin-documents/:documentIndex",
    generalLimiter,
    requireAdmin,
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
        const absolutePath = await fetchAdminRequisitionDocumentPath(pool, requisitionId, documentIndex);

        if (!absolutePath || !fs.existsSync(absolutePath)) {
          return res.status(404).json({ error: "Document not found." });
        }

        res.setHeader("Content-Type", mimeTypeForDocument(absolutePath));
        res.setHeader("Content-Disposition", `inline; filename="${documentNameFromPath(absolutePath)}"`);
        return res.sendFile(absolutePath);
      } catch (err) {
        console.error("Admin document download error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.post("/requisitions/:requisitionId/admin-verify", generalLimiter, requireAdmin, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    const decision = String(req.body?.decision ?? "").trim().toLowerCase();
    if (decision !== "verify" && decision !== "reject") {
      return res.status(400).json({ error: 'Decision must be "verify" or "reject".' });
    }

    const remarks = req.body?.remarks;

    try {
      const result = await adminVerifyRequisition(pool, {
        requisitionId,
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
            : "Requisition verified and forwarded for approval.",
      });
    } catch (err) {
      console.error("Admin verify error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/approval/queue", generalLimiter, requireApproval, async (req, res) => {
    try {
      const result = await queryApprovalQueue(pool);
      return res.json(result);
    } catch (err) {
      console.error("Approval queue error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/approval/dashboard-stats", generalLimiter, requireApproval, async (req, res) => {
    try {
      const result = await queryApprovalDashboardStats(pool);
      return res.json(result);
    } catch (err) {
      console.error("Approval dashboard stats error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/approval/dashboard-items", generalLimiter, requireApproval, async (req, res) => {
    try {
      const view = String(req.query.view ?? "pending").trim().toLowerCase();
      const allowedViews = new Set(["pending", "approved", "rejected", "verified"]);
      if (!allowedViews.has(view)) {
        return res.status(400).json({ error: "Invalid dashboard view." });
      }

      const result = await queryApprovalDashboardItems(pool, view);
      return res.json(result);
    } catch (err) {
      console.error("Approval dashboard items error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/approval/report-stats", generalLimiter, requireApproval, async (req, res) => {
    try {
      const result = await queryAdminReportStats(pool);
      return res.json(result);
    } catch (err) {
      console.error("Approval report stats error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/:requisitionId/approval", generalLimiter, requireApproval, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const detail = await queryApprovalDetail(pool, requisitionId);
      if (!detail) {
        return res.status(404).json({ error: "Requisition not found in the approval queue." });
      }
      return res.json(detail);
    } catch (err) {
      console.error("Approval detail error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get(
    "/requisitions/:requisitionId/approval-documents/:documentIndex",
    generalLimiter,
    requireApproval,
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
        const absolutePath = await fetchApprovalRequisitionDocumentPath(pool, requisitionId, documentIndex);

        if (!absolutePath || !fs.existsSync(absolutePath)) {
          return res.status(404).json({ error: "Document not found." });
        }

        res.setHeader("Content-Type", mimeTypeForDocument(absolutePath));
        res.setHeader("Content-Disposition", `inline; filename="${documentNameFromPath(absolutePath)}"`);
        return res.sendFile(absolutePath);
      } catch (err) {
        console.error("Approval document download error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.post("/requisitions/:requisitionId/approval", generalLimiter, requireApproval, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    const decision = String(req.body?.decision ?? "").trim().toLowerCase();
    if (decision !== "approve" && decision !== "reject") {
      return res.status(400).json({ error: 'Decision must be "approve" or "reject".' });
    }

    const remarks = req.body?.remarks;

    try {
      const result = await approvalDecideRequisition(pool, {
        requisitionId,
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
            : "Requisition approved successfully.",
      });
    } catch (err) {
      console.error("Approval decision error:", err);
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
        message: result.resubmittingHr
          ? "Requisition resubmitted for HR verification."
          : "Requisition resubmitted to your Head of Department.",
      });
    } catch (err) {
      console.error("Resubmit requisition error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.get("/requisitions/:requisitionId/post-training", generalLimiter, requireAuth, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const context = await fetchStaffPostTrainingDetail(pool, requisitionId, req.session.user.staffId);
      if (!context) {
        return res.status(404).json({ error: "Requisition not found." });
      }
      if (context.error) {
        return res.status(context.status).json({ error: context.error });
      }
      return res.json(context.detail);
    } catch (err) {
      console.error("Get post-training error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.post("/requisitions/:requisitionId/post-training/e-survey", generalLimiter, requireAuth, async (req, res) => {
    const requisitionId = parsePositiveInt(req.params.requisitionId);
    if (!requisitionId) {
      return res.status(400).json({ error: "Invalid requisition ID." });
    }

    try {
      const result = await submitPostTrainingSurvey(pool, {
        requisitionId,
        staffId: req.session.user.staffId,
        body: req.body,
      });
      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.json({ message: result.message });
    } catch (err) {
      console.error("Post-training e-survey error:", err);
      const mapped = mapRequisitionDbError(err);
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  apiRouter.post(
    "/requisitions/:requisitionId/post-training/attendance",
    generalLimiter,
    requireAuth,
    (req, res, next) => {
      postTrainingUpload.single("attendance")(req, res, (err) => {
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

      try {
        const result = await submitPostTrainingAttendance(pool, {
          requisitionId,
          staffId: req.session.user.staffId,
          file: req.file,
        });
        if (result.error) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch {
              /* ignore */
            }
          }
          return res.status(result.status).json({ error: result.error });
        }
        return res.json({ message: result.message });
      } catch (err) {
        console.error("Post-training attendance error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.get(
    "/requisitions/:requisitionId/post-training/attendance",
    generalLimiter,
    requireAuth,
    async (req, res) => {
      const requisitionId = parsePositiveInt(req.params.requisitionId);
      if (!requisitionId) {
        return res.status(400).json({ error: "Invalid requisition ID." });
      }

      try {
        const filePath = await fetchStaffAttendanceFilePath(pool, requisitionId, req.session.user.staffId);
        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Attendance file not found." });
        }
        return res.sendFile(filePath);
      } catch (err) {
        console.error("Download attendance error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );

  apiRouter.delete(
    "/requisitions/:requisitionId/post-training/attendance",
    generalLimiter,
    requireAuth,
    async (req, res) => {
      const requisitionId = parsePositiveInt(req.params.requisitionId);
      if (!requisitionId) {
        return res.status(400).json({ error: "Invalid requisition ID." });
      }

      try {
        const result = await removePostTrainingAttendance(pool, {
          requisitionId,
          staffId: req.session.user.staffId,
        });
        if (result.error) {
          return res.status(result.status).json({ error: result.error });
        }
        return res.json({ message: result.message });
      } catch (err) {
        console.error("Remove attendance error:", err);
        const mapped = mapRequisitionDbError(err);
        return res.status(mapped.status).json({ error: mapped.error });
      }
    },
  );
}
