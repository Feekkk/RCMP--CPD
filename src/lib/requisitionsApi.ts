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

export type RequisitionHistoryItem = { 
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  venue: string;
  submittedAt: string;
  updatedAt: string;
  programmeDates: string[];
  totalBudget: number;
  status: string;
  statusGroup: "draft" | "submitted" | "pending" | "approved" | "rejected";
  workflowPhase: "draft" | "pre_training" | "post_training" | "completed" | "rejected";
  staffName: string;
  staffEmail: string;
  departmentName: string | null;
  hrdcClaimable: boolean;
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
  };
};

export type HodReviewDecision = "recommend" | "reject";

export type HodReviewResponse = {
  requisitionId: number;
  statusId: number;
  status: string;
  message: string;
};

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
): Promise<CreateRequisitionResponse> {
  return sendRequisitionForm(`/api/requisitions/${requisitionId}`, "PATCH", data, files, submitAs);
}

async function sendRequisitionForm(
  url: string,
  method: "POST" | "PATCH",
  data: RequisitionFormData,
  files: File[],
  submitAs: "draft" | "submit",
): Promise<CreateRequisitionResponse> {
  const formData = new FormData();
  formData.append("data", JSON.stringify({ ...data, submitAs }));

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
