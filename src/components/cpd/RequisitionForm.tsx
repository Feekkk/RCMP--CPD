import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProgrammeScheduleFields, type ProgrammeSlot } from "@/components/cpd/ProgrammeScheduleFields";
import { FundingClaimFields, type FundingClaim } from "@/components/cpd/FundingClaimFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createRequisition,
  fetchRequisitionForEdit,
  updateRequisition,
  type RequisitionFormData,
} from "@/lib/requisitionsApi";

type RequisitionFormProps = {
  editId?: number | null;
  onEditIdChange?: (id: number | null) => void;
};

export function RequisitionForm({ editId = null, onEditIdChange }: RequisitionFormProps) {
  const [category, setCategory] = React.useState("");
  const [justification, setJustification] = React.useState("");
  const [programmeTitle, setProgrammeTitle] = React.useState("");
  const [programmeSlots, setProgrammeSlots] = React.useState<ProgrammeSlot[]>([{ date: "", from: "", to: "" }]);
  const [programmeVenue, setProgrammeVenue] = React.useState("");
  const [programmeFees, setProgrammeFees] = React.useState("");
  const [fundingClaim, setFundingClaim] = React.useState<FundingClaim>("");
  const [organiserName, setOrganiserName] = React.useState("");
  const [organiserAddress, setOrganiserAddress] = React.useState("");
  const [organiserPhone, setOrganiserPhone] = React.useState("");
  const [organiserEmail, setOrganiserEmail] = React.useState("");
  const [organiserContactPerson, setOrganiserContactPerson] = React.useState("");
  const [budgetFees, setBudgetFees] = React.useState("");
  const [budgetMileage, setBudgetMileage] = React.useState("");
  const [budgetAccommodation, setBudgetAccommodation] = React.useState("");
  const [budgetTravelFare, setBudgetTravelFare] = React.useState("");
  const [budgetOthers, setBudgetOthers] = React.useState("");
  const [evidenceFiles, setEvidenceFiles] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = React.useState(false);

  const applyFormData = React.useCallback((data: RequisitionFormData & { existingDocuments?: string[] }) => {
    setCategory(data.category);
    setJustification(data.justification);
    setProgrammeTitle(data.programmeTitle);
    setProgrammeSlots(data.programmeSlots.length ? data.programmeSlots : [{ date: "", from: "", to: "" }]);
    setProgrammeVenue(data.programmeVenue);
    setProgrammeFees(data.programmeFees);
    setFundingClaim(data.fundingClaim);
    setOrganiserName(data.organiserName);
    setOrganiserAddress(data.organiserAddress);
    setOrganiserPhone(data.organiserPhone);
    setOrganiserEmail(data.organiserEmail);
    setOrganiserContactPerson(data.organiserContactPerson);
    setBudgetMileage(data.budgetMileage);
    setBudgetAccommodation(data.budgetAccommodation);
    setBudgetTravelFare(data.budgetTravelFare);
    setBudgetOthers(data.budgetOthers);
    setBudgetFees("");
    setEvidenceFiles([]);
    setExistingDocuments(data.existingDocuments ?? []);
  }, []);

  React.useEffect(() => {
    if (!editId) return;

    let cancelled = false;
    setIsLoadingDraft(true);
    fetchRequisitionForEdit(editId)
      .then((data) => {
        if (cancelled) return;
        applyFormData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Unable to load draft.");
        onEditIdChange?.(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDraft(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId, applyFormData, onEditIdChange]);

  const buildFormData = (): RequisitionFormData => ({
    category,
    justification,
    programmeTitle,
    programmeSlots,
    programmeVenue,
    programmeFees,
    fundingClaim,
    organiserName,
    organiserAddress,
    organiserPhone,
    organiserEmail,
    organiserContactPerson,
    budgetMileage,
    budgetAccommodation,
    budgetTravelFare,
    budgetOthers,
  });

  const resetForm = () => {
    applyFormData({
      category: "",
      justification: "",
      programmeTitle: "",
      programmeSlots: [{ date: "", from: "", to: "" }],
      programmeVenue: "",
      programmeFees: "",
      fundingClaim: "",
      organiserName: "",
      organiserAddress: "",
      organiserPhone: "",
      organiserEmail: "",
      organiserContactPerson: "",
      budgetMileage: "",
      budgetAccommodation: "",
      budgetTravelFare: "",
      budgetOthers: "",
      existingDocuments: [],
    });
    onEditIdChange?.(null);
  };

  const saveRequisition = async (submitAs: "draft" | "submit") => {
    const setBusy = submitAs === "submit" ? setIsSubmitting : setIsSaving;
    setBusy(true);
    try {
      const formData = buildFormData();
      const result = editId
        ? await updateRequisition(editId, formData, evidenceFiles, submitAs)
        : await createRequisition(formData, evidenceFiles, submitAs);
      toast.success(result.message);
      if (submitAs === "submit") {
        resetForm();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save requisition.");
    } finally {
      setBusy(false);
    }
  };

  const totalBudget = React.useMemo(() => {
    const n = (v: string) => {
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return n(budgetFees) + n(budgetMileage) + n(budgetAccommodation) + n(budgetTravelFare) + n(budgetOthers);
  }, [budgetAccommodation, budgetFees, budgetMileage, budgetOthers, budgetTravelFare]);

  const isBusy = isSaving || isSubmitting || isLoadingDraft;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{editId ? `Edit draft ${editId}` : "Requisition Form"}</CardTitle>
        <CardDescription>
          {editId
            ? "Update your saved draft and submit when ready."
            : "Fill in the details below to submit your requisition."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingDraft ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading draft…
          </div>
        ) : (
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRequisition("submit");
            }}
          >
            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">1. Categories</h2>
                <p className="text-sm text-muted-foreground">Select the requisition category.</p>
              </div>
              <div className="grid gap-2 md:max-w-md">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">2. Justification</h2>
                <p className="text-sm text-muted-foreground">Briefly explain the reason for this requisition.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Write your justification..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-28"
                />
              </div>
            </section>

            <Separator />

            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">3. Programme details</h2>
                <p className="text-sm text-muted-foreground">Provide programme schedule and basic details.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="programmeTitle">Title</Label>
                  <Input
                    id="programmeTitle"
                    placeholder="Programme title"
                    value={programmeTitle}
                    onChange={(e) => setProgrammeTitle(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <ProgrammeScheduleFields slots={programmeSlots} onChange={setProgrammeSlots} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="programmeVenue">Venue</Label>
                  <Input
                    id="programmeVenue"
                    placeholder="Venue"
                    value={programmeVenue}
                    onChange={(e) => setProgrammeVenue(e.target.value)}
                  />
                </div>
                <FundingClaimFields
                  fundingClaim={fundingClaim}
                  onFundingClaimChange={setFundingClaim}
                  programmeFees={programmeFees}
                  onProgrammeFeesChange={setProgrammeFees}
                />
              </div>
            </section>

            <Separator />

            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">4. Organiser detail</h2>
                <p className="text-sm text-muted-foreground">Who is organizing this programme?</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="organiserName">Organiser</Label>
                  <Input id="organiserName" value={organiserName} onChange={(e) => setOrganiserName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organiserContactPerson">Contact person</Label>
                  <Input
                    id="organiserContactPerson"
                    value={organiserContactPerson}
                    onChange={(e) => setOrganiserContactPerson(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="organiserAddress">Address</Label>
                  <Textarea
                    id="organiserAddress"
                    value={organiserAddress}
                    onChange={(e) => setOrganiserAddress(e.target.value)}
                    className="min-h-24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organiserPhone">Phone num</Label>
                  <Input id="organiserPhone" type="tel" value={organiserPhone} onChange={(e) => setOrganiserPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organiserEmail">Email</Label>
                  <Input id="organiserEmail" type="email" value={organiserEmail} onChange={(e) => setOrganiserEmail(e.target.value)} />
                </div>
              </div>
            </section>

            <Separator />

            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">5. Budget Allocation</h2>
                <p className="text-sm text-muted-foreground">Leave blank if not applicable.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["budgetMileage", "Mileage", budgetMileage, setBudgetMileage],
                  ["budgetAccommodation", "Accommodation", budgetAccommodation, setBudgetAccommodation],
                  ["budgetTravelFare", "Air / travel fare", budgetTravelFare, setBudgetTravelFare],
                  ["budgetOthers", "Others", budgetOthers, setBudgetOthers],
                ].map(([id, label, value, setter]) => (
                  <div key={id as string} className="grid gap-2">
                    <Label htmlFor={id as string}>{label as string}</Label>
                    <Input
                      id={id as string}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={value as string}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold tracking-tight">{totalBudget.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="grid gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-tight">6. Upload Documents</h2>
                <p className="text-sm text-muted-foreground">Upload supporting and evidence related documents.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evidenceFiles">Documents</Label>
                <Input
                  id="evidenceFiles"
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => setEvidenceFiles(Array.from(e.target.files ?? []))}
                />
                {existingDocuments.length ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Existing files</p>
                    <ul className="mt-2 grid gap-1">
                      {existingDocuments.map((path) => (
                        <li key={path} className="truncate">
                          {path.split("/").pop()}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {evidenceFiles.length ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">New uploads</p>
                    <ul className="mt-2 grid gap-1">
                      {evidenceFiles.map((f) => (
                        <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate">
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => void saveRequisition("draft")} disabled={isBusy}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
