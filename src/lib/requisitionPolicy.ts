import { addMonths, differenceInCalendarDays, format, isAfter, parseISO, startOfDay } from "date-fns";

export const REQUISITION_LEAD_TIME_MONTHS = 2;

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
      message: `The programme date (${formattedProgrammeDate}) is in the past. This requisition will be treated as urgent and requires approval by the Dean or HR.`,
    };
  }

  if (isUrgent) {
    return {
      isUrgent: true,
      programmeDate,
      latestNormalSubmitDate,
      daysUntilProgramme,
      message: `This programme is within ${REQUISITION_LEAD_TIME_MONTHS} months (${daysUntilProgramme} day${daysUntilProgramme === 1 ? "" : "s"} away). Requisitions must normally be submitted by ${formattedDeadline}. Your request will be flagged as urgent and requires approval by the Dean or HR.`,
    };
  }

  return {
    isUrgent: false,
    programmeDate,
    latestNormalSubmitDate,
    daysUntilProgramme,
    message: `This programme date meets the submission policy. Submit by ${formattedDeadline} (at least ${REQUISITION_LEAD_TIME_MONTHS} months before ${formattedProgrammeDate}).`,
  };
}

export const REQUISITION_POLICY_RULES = [
  {
    title: "Advance submission",
    description: `Requisitions must be submitted at least ${REQUISITION_LEAD_TIME_MONTHS} months before the programme date.`,
  },
  {
    title: "Urgent requisitions",
    description:
      "If submitted within 2 months of the programme date, the request is treated as urgent and requires approval by the Dean or HR.",
  },
  {
    title: "Programme schedule",
    description: "Enter the actual programme date in the requisition form. The system will indicate whether your submission follows policy.",
  },
] as const;
