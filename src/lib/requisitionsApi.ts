import type { HistoryPhaseFilter } from "@/lib/requisitionStatus";
import type { FundingClaim } from "@/components/cpd/FundingClaimFields";
import type { ProgrammeSlot } from "@/components/cpd/ProgrammeScheduleFields";

export type RequisitionFormData = {
  category: string;
  justification: string;
  programmeTitle: string;
  programmeSlots: ProgrammeSlot[];
  programmeVenue: string;
  programmeFees: string;
  fundingClaim: FundingClaim;
  organiserName: string;
  organiserAddress: string;
  organiserPhone: string;
  organiserEmail: string;
  organiserContactPerson: string;
  budgetMileage: string;
  budgetAccommodation: string;
  budgetTravelFare: string;
  budgetOthers: string;
};

export type RequisitionDraftData = RequisitionFormData & {
  requisitionId: number;
  status: string;
  existingDocuments: string[];
};

export type CreateRequisitionResponse = {
  requisitionId: number;
  statusId: number;
  status: "submitted" | "save_draft";
  message: string;
};

export type MyRequisitionSummary = {
  requisitionId: number;
  category: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PostTrainingInfo = {
  attendanceAttached: boolean;
  eSurveyFilled: boolean;
  hodEvaluationFilled: boolean;
  cpdPointsCounted: boolean;
  cpdPoints: number | null;
  completedSteps: number;
  totalSteps: number;
  isComplete: boolean;
};

export type ESurveyResponses = {
  objectivesMet: "yes" | "partially" | "no";
  satisfaction: "1" | "2" | "3" | "4" | "5";
  wouldRecommend: "yes" | "no";
  comments: string | null;
};

export type PostTrainingDetail = {
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  venue: string;
  programmeSlots: HodProgrammeSlot[];
  programmeDates: string[];
  workflowPhase: RequisitionHistoryItem["workflowPhase"];
  locked: boolean;
  postTraining: PostTrainingInfo & {
    attendanceFileName: string | null;
    eSurveyResponses: ESurveyResponses | null;
  };
};

export type RequisitionHistoryItem = { 
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  venue: string;
  submittedAt: string;
  updatedAt: string;
  programmeDates: string[];
  programmeSlots: HodProgrammeSlot[];
  totalBudget: number;
  status: string;
  statusGroup: "draft" | "submitted" | "pending" | "approved" | "rejected";
  workflowPhase: "draft" | "pre_training" | "post_training" | "completed" | "rejected";
  staffName: string;
  staffEmail: string;
  departmentName: string | null;
  hrdcClaimable: boolean;
  rejectionRemarks: string | null;
  postTraining: PostTrainingInfo;
};

export type RequisitionHistorySummary = {
  all: number;
  draft: number;
  preTraining: number;
  postTraining: number;
  completed: number;
  rejected: number;
};

export type RequisitionHistoryResponse = {
  requisitions: RequisitionHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: RequisitionHistorySummary;
};

export type HodQueueStatus = "pending" | "recommended";

export type HodReviewDocument = {
  index: number;
  name: string;
  url: string;
};

export type HodProgrammeSlot = {
  date: string;
  from: string;
  to: string;
};

export type HodReviewQueueItem = {
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  venue: string;
  justification: string;
  submittedAt: string;
  programmeDates: string[];
  programmeSlots: HodProgrammeSlot[];
  totalBudget: number;
  budget: {
    mileage: number;
    accommodation: number;
    travelFare: number;
    others: number;
    total: number;
  };
  status: string;
  hodStatus: HodQueueStatus;
  staffName: string;
  staffEmail: string;
  departmentName: string | null;
  hrdcClaimable: boolean;
  fundingClaim: string;
  organiser: {
    name: string;
    contactPerson: string;
    address: string;
    phone: string;
    email: string;
  };
  documents: HodReviewDocument[];
};

export type HodReviewQueueResponse = {
  requisitions: HodReviewQueueItem[];
  summary: {
    total: number;
    pending: number;
    recommended: number;
    rejectedByHod: number;
  };
};

export type HodEvaluationStatus = "upcoming" | "due" | "completed";

export type HodEvaluationResponses = {
  knowledgeApplied: "yes" | "partially" | "no";
  performanceImpact: "1" | "2" | "3" | "4" | "5";
  supportsDepartmentGoals: "yes" | "no";
  comments: string | null;
};

export type HodPostTrainingQueueItem = {
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  venue: string;
  submittedAt: string;
  programmeDates: string[];
  programmeSlots: HodProgrammeSlot[];
  lastProgrammeDate: string | null;
  evaluationDueDate: string | null;
  evaluationStatus: HodEvaluationStatus;
  staffName: string;
  staffEmail: string;
  departmentName: string | null;
  hodEvaluationFilled: boolean;
  staffSurveyResponses: ESurveyResponses | null;
  hodEvaluationResponses: HodEvaluationResponses | null;
  postTraining: PostTrainingInfo;
};

export type HodPostTrainingQueueResponse = {
  requisitions: HodPostTrainingQueueItem[];
  summary: {
    total: number;
    due: number;
    upcoming: number;
    completed: number;
  };
};

export type CpdTrackStatus = "on-track" | "need-attention" | "off-track";

export type HodDepartmentStaffMember = {
  staffId: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  cpdCompletedHours: number;
  cpdTargetHours: number;
  trackStatus: CpdTrackStatus;
};

export type HodDepartmentStaffResponse = {
  departmentId: number;
  departmentName: string;
  staff: HodDepartmentStaffMember[];
};

export type HodEvaluationSubmission = {
  knowledgeApplied: "yes" | "partially" | "no";
  performanceImpact: "1" | "2" | "3" | "4" | "5";
  supportsDepartmentGoals: "yes" | "no";
  comments?: string;
};

export type HodReviewDecision = "recommend" | "reject";

export type HodReviewResponse = {
  requisitionId: number;
  statusId: number;
  status: string;
  message: string;
};

export type HodRecommendation = {
  name: string;
  email: string;
  recommendedAt: string;
  remarks: string | null;
};

export type AdminVerifyQueueItem = Omit<HodReviewQueueItem, "hodStatus"> & {
  hodRecommendation: HodRecommendation | null;
};

export type AdminVerifyQueueResponse = {
  requisitions: AdminVerifyQueueItem[];
  summary: {
    total: number;
  };
};

export type AdminVerifyDecision = "verify" | "reject";

export type AdminVerifyResponse = HodReviewResponse;

export type HrVerification = {
  name: string;
  email: string;
  verifiedAt: string;
  remarks: string | null;
};

export type ApprovalQueueItem = AdminVerifyQueueItem & {
  hrVerification: HrVerification | null;
};

export type ApprovalQueueResponse = {
  requisitions: ApprovalQueueItem[];
  summary: {
    total: number;
  };
};

export type ApprovalDecision = "approve" | "reject";

export type ApprovalResponse = HodReviewResponse;

async function parseApiError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
  return [data.error, data.hint].filter(Boolean).join(" ") || fallback;
}

export async function createRequisition(
  data: RequisitionFormData,
  files: File[],
  submitAs: "draft" | "submit",
): Promise<CreateRequisitionResponse> {
  return sendRequisitionForm("/api/requisitions", "POST", data, files, submitAs);
}

export async function updateRequisition(
  requisitionId: number,
  data: RequisitionFormData,
  files: File[],
  submitAs: "draft" | "submit",
  keptDocuments?: string[],
): Promise<CreateRequisitionResponse> {
  return sendRequisitionForm(`/api/requisitions/${requisitionId}`, "PATCH", data, files, submitAs, keptDocuments);
}

async function sendRequisitionForm(
  url: string,
  method: "POST" | "PATCH",
  data: RequisitionFormData,
  files: File[],
  submitAs: "draft" | "submit",
  keptDocuments?: string[],
): Promise<CreateRequisitionResponse> {
  const payload: RequisitionFormData & { submitAs: "draft" | "submit"; keptDocuments?: string[] } = {
    ...data,
    submitAs,
  };
  if (method === "PATCH") {
    payload.keptDocuments = keptDocuments ?? [];
  }

  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));

  for (const file of files.slice(0, 3)) {
    formData.append("documents", file);
  }

  const res = await fetch(url, {
    method,
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, `Request failed (${res.status}).`));
  }

  return res.json() as Promise<CreateRequisitionResponse>;
}

export async function fetchRequisitionForEdit(requisitionId: number): Promise<RequisitionDraftData> {
  const res = await fetch(`/api/requisitions/${requisitionId}`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition."));
  }

  return res.json() as Promise<RequisitionDraftData>;
}

export async function fetchMyRequisitions(): Promise<MyRequisitionSummary[]> {
  const res = await fetch("/api/requisitions/mine", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisitions."));
  }

  const data = (await res.json()) as { requisitions: MyRequisitionSummary[] };
  return data.requisitions;
}

export type RequisitionLogEntry = {
  logId: number;
  requisitionId: number;
  requisitionTitle: string;
  venue: string;
  submittedAt: string;
  changedAt: string;
  oldStatus: string | null;
  newStatus: string;
  remarks: string | null;
  changedByName: string;
  changedByEmail: string;
};

export type RequisitionLogsResponse = {
  logs: RequisitionLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function fetchRequisitionLogs({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<RequisitionLogsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`/api/requisitions/logs?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition logs."));
  }

  return res.json() as Promise<RequisitionLogsResponse>;
}

export async function fetchRequisitionHistory({
  phase = "all",
  page = 1,
  pageSize = 10,
}: {
  phase?: HistoryPhaseFilter;
  page?: number;
  pageSize?: number;
} = {}): Promise<RequisitionHistoryResponse> {
  const params = new URLSearchParams({
    phase,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`/api/requisitions/history?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition history."));
  }

  return res.json() as Promise<RequisitionHistoryResponse>;
}

export async function fetchHodReviewQueue(): Promise<HodReviewQueueResponse> {
  const res = await fetch("/api/requisitions/hod/review-queue", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load review queue."));
  }

  return res.json() as Promise<HodReviewQueueResponse>;
}

export async function fetchHodRequisitionHistory({
  phase = "all",
  page = 1,
  pageSize = 10,
}: {
  phase?: HistoryPhaseFilter;
  page?: number;
  pageSize?: number;
} = {}): Promise<RequisitionHistoryResponse> {
  const params = new URLSearchParams({
    phase,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`/api/requisitions/hod/history?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load department requisitions."));
  }

  return res.json() as Promise<RequisitionHistoryResponse>;
}

export async function fetchHodPostTrainingQueue(): Promise<HodPostTrainingQueueResponse> {
  const res = await fetch("/api/requisitions/hod/post-training-queue", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load post-training queue."));
  }

  return res.json() as Promise<HodPostTrainingQueueResponse>;
}

export async function fetchHodDepartmentStaff(): Promise<HodDepartmentStaffResponse> {
  const res = await fetch("/api/requisitions/hod/department-staff", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load department staff."));
  }

  return res.json() as Promise<HodDepartmentStaffResponse>;
}

export async function fetchHodPostTrainingDetail(requisitionId: number): Promise<HodPostTrainingQueueItem> {
  const res = await fetch(`/api/requisitions/${requisitionId}/hod-evaluation`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load evaluation details."));
  }

  return res.json() as Promise<HodPostTrainingQueueItem>;
}

export async function submitHodEvaluation(
  requisitionId: number,
  data: HodEvaluationSubmission,
): Promise<{ message: string }> {
  const res = await fetch(`/api/requisitions/${requisitionId}/hod-evaluation`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to submit HOD evaluation."));
  }

  return res.json() as Promise<{ message: string }>;
}

export async function fetchHodReviewDetail(requisitionId: number): Promise<HodReviewQueueItem> {
  const res = await fetch(`/api/requisitions/${requisitionId}/hod-review`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition details."));
  }

  return res.json() as Promise<HodReviewQueueItem>;
}

export async function submitHodReview(
  requisitionId: number,
  decision: HodReviewDecision,
  remarks?: string,
): Promise<HodReviewResponse> {
  const res = await fetch(`/api/requisitions/${requisitionId}/hod-review`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, remarks }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to submit review."));
  }

  return res.json() as Promise<HodReviewResponse>;
}

export type AdminDashboardStats = {
  pendingVerification: number;
  verifiedThisMonth: number;
  rejectedThisMonth: number;
  totalStaff: number;
};

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const res = await fetch("/api/requisitions/admin/dashboard-stats", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load dashboard stats."));
  }

  return res.json() as Promise<AdminDashboardStats>;
}

export type AdminRecentSubmissionsResponse = {
  requisitions: RequisitionHistoryItem[];
};

export async function fetchAdminRecentSubmissions(pageSize = 5): Promise<AdminRecentSubmissionsResponse> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  const res = await fetch(`/api/requisitions/admin/recent-submissions?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load recent submissions."));
  }

  return res.json() as Promise<AdminRecentSubmissionsResponse>;
}

export type AdminReportDivisionHours = {
  staffCount: number;
  totalHours: number;
  averageHours: number;
  targetHours: number;
};

export type AdminReportDepartmentPerformance = {
  departmentId: number;
  departmentName: string;
  staffCount: number;
  completion: number;
  avgHours: number;
  risk: "Low" | "Moderate" | "High";
};

export type AdminReportMonthlyTrend = {
  month: string;
  monthKey: string;
  hours: number;
};

export type AdminReportStats = {
  totalStaff: number;
  compliantStaff: number;
  cpdTargetHours: number;
  approvedRequisitionsThisMonth: number;
  submittedRequisitionsThisMonth: number;
  totalTrainingHours: number;
  participantsThisMonth: number;
  divisionHours: {
    academic: AdminReportDivisionHours;
    services: AdminReportDivisionHours;
  };
  topDepartments: AdminReportDepartmentPerformance[];
  monthlyTrend: AdminReportMonthlyTrend[];
};

export async function fetchAdminReportStats(): Promise<AdminReportStats> {
  const res = await fetch("/api/requisitions/admin/report-stats", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load report stats."));
  }

  return res.json() as Promise<AdminReportStats>;
}

export async function fetchAdminVerifyQueue(): Promise<AdminVerifyQueueResponse> {
  const res = await fetch("/api/requisitions/admin/verify-queue", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load verify queue."));
  }

  return res.json() as Promise<AdminVerifyQueueResponse>;
}

export async function fetchAdminVerifyDetail(requisitionId: number): Promise<AdminVerifyQueueItem> {
  const res = await fetch(`/api/requisitions/${requisitionId}/admin-verify`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition details."));
  }

  return res.json() as Promise<AdminVerifyQueueItem>;
}

export async function submitAdminVerify(
  requisitionId: number,
  decision: AdminVerifyDecision,
  remarks?: string,
): Promise<AdminVerifyResponse> {
  const res = await fetch(`/api/requisitions/${requisitionId}/admin-verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, remarks }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to submit verification."));
  }

  return res.json() as Promise<AdminVerifyResponse>;
}

export async function fetchApprovalQueue(): Promise<ApprovalQueueResponse> {
  const res = await fetch("/api/requisitions/approval/queue", { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load approval queue."));
  }

  return res.json() as Promise<ApprovalQueueResponse>;
}

export async function fetchApprovalDetail(requisitionId: number): Promise<ApprovalQueueItem> {
  const res = await fetch(`/api/requisitions/${requisitionId}/approval`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load requisition details."));
  }

  return res.json() as Promise<ApprovalQueueItem>;
}

export async function submitApproval(
  requisitionId: number,
  decision: ApprovalDecision,
  remarks?: string,
): Promise<ApprovalResponse> {
  const res = await fetch(`/api/requisitions/${requisitionId}/approval`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, remarks }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to submit approval decision."));
  }

  return res.json() as Promise<ApprovalResponse>;
}

export async function resubmitRequisition(requisitionId: number): Promise<CreateRequisitionResponse> {
  const res = await fetch(`/api/requisitions/${requisitionId}/resubmit`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to resubmit requisition."));
  }

  return res.json() as Promise<CreateRequisitionResponse>;
}

export async function fetchPostTrainingDetail(requisitionId: number): Promise<PostTrainingDetail> {
  const res = await fetch(`/api/requisitions/${requisitionId}/post-training`, { credentials: "include" });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to load post-training details."));
  }

  return res.json() as Promise<PostTrainingDetail>;
}

export type ESurveySubmission = {
  objectivesMet: "yes" | "partially" | "no";
  satisfaction: "1" | "2" | "3" | "4" | "5";
  wouldRecommend: "yes" | "no";
  comments?: string;
};

export async function submitPostTrainingSurvey(
  requisitionId: number,
  data: ESurveySubmission,
): Promise<{ message: string }> {
  const res = await fetch(`/api/requisitions/${requisitionId}/post-training/e-survey`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to submit e-survey."));
  }

  return res.json() as Promise<{ message: string }>;
}

export async function submitPostTrainingAttendance(
  requisitionId: number,
  file: File,
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("attendance", file);

  const res = await fetch(`/api/requisitions/${requisitionId}/post-training/attendance`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to upload attendance evidence."));
  }

  return res.json() as Promise<{ message: string }>;
}

export function postTrainingAttendanceUrl(requisitionId: number): string {
  return `/api/requisitions/${requisitionId}/post-training/attendance`;
}

export async function removePostTrainingAttendance(requisitionId: number): Promise<{ message: string }> {
  const res = await fetch(`/api/requisitions/${requisitionId}/post-training/attendance`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Unable to remove attendance evidence."));
  }

  return res.json() as Promise<{ message: string }>;
}
