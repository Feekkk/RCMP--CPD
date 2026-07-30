import { addMonths, differenceInCalendarDays, format, isAfter, parseISO, startOfDay } from "date-fns";

export const REQUISITION_LEAD_TIME_MONTHS = 1;

export const LEAD_TIME_LABEL = `${REQUISITION_LEAD_TIME_MONTHS} month${REQUISITION_LEAD_TIME_MONTHS === 1 ? "" : "s"}`;

export const URGENT_APPROVER = "Head of Human Capital Department";

export type RequisitionDatePolicy = {
  isUrgent: boolean;
  programmeDate: Date;
  latestNormalSubmitDate: Date;
  daysUntilProgramme: number;
  message: string;
};

export function evaluateRequisitionDatePolicy(programmeDateStr: string): RequisitionDatePolicy | null {
  if (!programmeDateStr.trim()) return null;

  const programmeDate = startOfDay(parseISO(programmeDateStr));
  if (Number.isNaN(programmeDate.getTime())) return null;

  const today = startOfDay(new Date());
  const latestNormalSubmitDate = addMonths(programmeDate, -REQUISITION_LEAD_TIME_MONTHS);
  const daysUntilProgramme = differenceInCalendarDays(programmeDate, today);
  const isUrgent = isAfter(today, latestNormalSubmitDate);

  const formattedProgrammeDate = format(programmeDate, "d MMM yyyy");
  const formattedDeadline = format(latestNormalSubmitDate, "d MMM yyyy");

  if (daysUntilProgramme < 0) {
    return {
      isUrgent: true,
      programmeDate,
      latestNormalSubmitDate,
      daysUntilProgramme,
      message: `Programme date ${formattedProgrammeDate} is in the past. This requisition is urgent and requires ${URGENT_APPROVER} approval.`,
    };
  }

  if (isUrgent) {
    return {
      isUrgent: true,
      programmeDate,
      latestNormalSubmitDate,
      daysUntilProgramme,
      message: `Programme is ${daysUntilProgramme} day${daysUntilProgramme === 1 ? "" : "s"} away (within ${LEAD_TIME_LABEL}). Flagged as urgent — ${URGENT_APPROVER} approval required. Normal deadline was ${formattedDeadline}.`,
    };
  }

  return {
    isUrgent: false,
    programmeDate,
    latestNormalSubmitDate,
    daysUntilProgramme,
    message: `On track. Submit by ${formattedDeadline} to stay within the ${LEAD_TIME_LABEL} lead-time policy.`,
  };
}

export type SchedulePolicySummary = {
  hasDates: boolean;
  isUrgent: boolean;
  message: string;
  policies: RequisitionDatePolicy[];
};

export function getSchedulePolicySummary(programmeDates: string[]): SchedulePolicySummary | null {
  const policies = programmeDates
    .map((date) => evaluateRequisitionDatePolicy(date))
    .filter((policy): policy is RequisitionDatePolicy => policy !== null);

  if (policies.length === 0) return null;

  const urgentPolicies = policies.filter((policy) => policy.isUrgent);
  const isUrgent = urgentPolicies.length > 0;

  if (policies.length === 1) {
    const [only] = policies;
    return {
      hasDates: true,
      isUrgent: only.isUrgent,
      message: only.message,
      policies,
    };
  }

  if (isUrgent) {
    const urgentCount = urgentPolicies.length;
    return {
      hasDates: true,
      isUrgent: true,
      message:
        urgentCount === policies.length
          ? `All ${urgentCount} programme dates fall within ${LEAD_TIME_LABEL}. This requisition is urgent and requires ${URGENT_APPROVER} approval.`
          : `${urgentCount} of ${policies.length} dates fall within ${LEAD_TIME_LABEL}. Those dates make this requisition urgent and require ${URGENT_APPROVER} approval.`,
      policies,
    };
  }

  return {
    hasDates: true,
    isUrgent: false,
    message: `All ${policies.length} programme dates meet the ${LEAD_TIME_LABEL} lead-time policy.`,
    policies,
  };
}

export const REQUISITION_POLICY_RULES = [
  {
    title: "Requisition Submission",
    description: `Submit at least ${LEAD_TIME_LABEL} before the earliest programme date.`,
  },
  {
    title: "Approval workflow",
    description: "Submission -> Head of Department -> Human Capital Review -> Final Approval",
  },
  {
    title: "Urgent submissions",
    description: `Dates within ${LEAD_TIME_LABEL} (or already past) are flagged urgent and need ${URGENT_APPROVER} approval.`,
  },
  {
    title: "Post-training",
    description: "After the programme, complete attendance, e-survey, and HOD evaluation before hours are counted.",
  },
  {
    title: "Annual Target",
    description: "Staff must complete hours of approved hours each year.",
  },
] as const;
