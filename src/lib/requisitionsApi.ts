import type { HistoryStatusFilter } from "@/lib/requisitionStatus";
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

export type RequisitionHistoryItem = {
  requisitionId: number;
  id: string;
  title: string;
  category: string;
  submittedAt: string;
  updatedAt: string;
  totalBudget: number;
  status: string;
  statusGroup: "draft" | "submitted" | "pending" | "approved" | "rejected";
  staffName: string;
  staffEmail: string;
  departmentName: string | null;
};

export type RequisitionHistoryResponse = {
  requisitions: RequisitionHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  const formData = new FormData();
  formData.append("data", JSON.stringify({ ...data, submitAs }));

  for (const file of files.slice(0, 3)) {
    formData.append("documents", file);
  }

  const res = await fetch("/api/requisitions", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, `Request failed (${res.status}).`));
  }

  return res.json() as Promise<CreateRequisitionResponse>;
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
  status = "all",
  page = 1,
  pageSize = 10,
}: {
  status?: HistoryStatusFilter;
  page?: number;
  pageSize?: number;
} = {}): Promise<RequisitionHistoryResponse> {
  const params = new URLSearchParams({
    status,
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
