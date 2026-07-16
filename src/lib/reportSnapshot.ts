type SnapshotDepartment = {
  departmentName: string;
  risk: "Low" | "Moderate" | "High";
};

type SnapshotInput = {
  totalStaff: number;
  compliantStaff: number;
  complianceRate: number;
  approvalRate: number;
  submittedClaims: number;
  totalHours: number;
  departments: SnapshotDepartment[];
};

export function buildExecutiveSnapshot({
  totalStaff,
  complianceRate,
  approvalRate,
  submittedClaims,
  departments,
}: SnapshotInput): { headline: string; detail: string } {
  if (!totalStaff) {
    return {
      headline: "No CPD activity recorded yet.",
      detail:
        "Summary statistics, department performance, and learning trends will appear here once staff submit requisitions and log CPD hours.",
    };
  }

  const highRiskCount = departments.filter((dept) => dept.risk === "High").length;
  const hasHighRisk = highRiskCount > 0;

  const headline = hasHighRisk
    ? "CPD performance is progressing, with a few units needing intervention."
    : complianceRate >= 70
      ? "CPD performance is on track across departments."
      : "CPD participation is still building momentum this cycle.";

  const complianceSentence =
    complianceRate >= 70
      ? "Most staff have met their yearly CPD target and training activity remains healthy."
      : complianceRate >= 40
        ? "Around half of staff have met their yearly CPD target, with steady training activity."
        : "Most staff have yet to reach their yearly CPD target, so participation needs a push.";

  const approvalSentence = !submittedClaims
    ? "No requisitions were submitted this month."
    : approvalRate >= 70
      ? "The approval flow is moving smoothly this month."
      : "Several of this month's requisitions are still moving through approval.";

  const riskSentence = hasHighRisk
    ? "The main priority is lifting completion in lower-performing units before the next review cycle."
    : "No departments are currently flagged as high risk.";

  return {
    headline,
    detail: `${complianceSentence} ${approvalSentence} ${riskSentence}`,
  };
}
