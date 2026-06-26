import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FundingClaim = "" | "hrdc" | "ciast" | "others";

export const FUNDING_CLAIM_OPTIONS = [
  { value: "hrdc" as const, label: "HRDC" },
  { value: "ciast" as const, label: "CIAST" },
  { value: "others" as const, label: "Others" },
];

interface FundingClaimFieldsProps {
  fundingClaim: FundingClaim;
  onFundingClaimChange: (value: FundingClaim) => void;
  programmeFees: string;
  onProgrammeFeesChange: (value: string) => void;
  idPrefix?: string;
}

export function FundingClaimFields({
  fundingClaim,
  onFundingClaimChange,
  programmeFees,
  onProgrammeFeesChange,
  idPrefix = "",
}: FundingClaimFieldsProps) {
  const claimId = `${idPrefix}fundingClaim`;
  const feesId = `${idPrefix}programmeFees`;
  const showFees = fundingClaim !== "";

  const handleClaimChange = (value: string) => {
    const next = value as FundingClaim;
    onFundingClaimChange(next);
    if (!next) {
      onProgrammeFeesChange("");
    }
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={claimId}>HRDC claimable</Label>
        <Select value={fundingClaim || undefined} onValueChange={handleClaimChange}>
          <SelectTrigger id={claimId}>
            <SelectValue placeholder="Select funding claim" />
          </SelectTrigger>
          <SelectContent>
            {FUNDING_CLAIM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showFees ? (
        <div className="grid gap-2">
          <Label htmlFor={feesId}>Fees</Label>
          <Input
            id={feesId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={programmeFees}
            onChange={(e) => onProgrammeFeesChange(e.target.value)}
          />
        </div>
      ) : null}
    </>
  );
}
