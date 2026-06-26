import * as React from "react";
import { FileText } from "lucide-react";

import { ProgrammeScheduleFields, type ProgrammeSlot } from "@/components/cpd/ProgrammeScheduleFields";
import { FundingClaimFields, type FundingClaim } from "@/components/cpd/FundingClaimFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AdminSidebar } from "@/admin/Sidebar";

export function AdminRequisitionsPage() {
  const [category, setCategory] = React.useState<string>("");
  const [justification, setJustification] = React.useState<string>("");

  const [programmeTitle, setProgrammeTitle] = React.useState<string>("");
  const [programmeSlots, setProgrammeSlots] = React.useState<ProgrammeSlot[]>([{ date: "", from: "", to: "" }]);
  const [programmeVenue, setProgrammeVenue] = React.useState<string>("");
  const [programmeFees, setProgrammeFees] = React.useState<string>("");
  const [fundingClaim, setFundingClaim] = React.useState<FundingClaim>("");

  const [organiserName, setOrganiserName] = React.useState<string>("");
  const [organiserAddress, setOrganiserAddress] = React.useState<string>("");
  const [organiserPhone, setOrganiserPhone] = React.useState<string>("");
  const [organiserEmail, setOrganiserEmail] = React.useState<string>("");
  const [organiserContactPerson, setOrganiserContactPerson] = React.useState<string>("");

  const [budgetMileage, setBudgetMileage] = React.useState<string>("");
  const [budgetAccommodation, setBudgetAccommodation] = React.useState<string>("");
  const [budgetTravelFare, setBudgetTravelFare] = React.useState<string>("");
  const [budgetOthers, setBudgetOthers] = React.useState<string>("");

  const [evidenceFiles, setEvidenceFiles] = React.useState<File[]>([]);

  const totalBudget = React.useMemo(() => {
    const n = (v: string) => {
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return n(budgetMileage) + n(budgetAccommodation) + n(budgetTravelFare) + n(budgetOthers);
  }, [budgetAccommodation, budgetMileage, budgetOthers, budgetTravelFare]);

  const resetForm = () => {
    setCategory("");
    setJustification("");
    setProgrammeTitle("");
    setProgrammeSlots([{ date: "", from: "", to: "" }]);
    setProgrammeVenue("");
    setProgrammeFees("");
    setFundingClaim("");
    setOrganiserName("");
    setOrganiserAddress("");
    setOrganiserPhone("");
    setOrganiserEmail("");
    setOrganiserContactPerson("");
    setBudgetMileage("");
    setBudgetAccommodation("");
    setBudgetTravelFare("");
    setBudgetOthers("");
    setEvidenceFiles([]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              <h1 className="font-display text-2xl font-bold tracking-tight">Requisitions</h1>
            </div>
            <Button type="button" onClick={resetForm}>
              <FileText className="h-4 w-4" />
              New Requisition
            </Button>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Requisition Form</CardTitle>
              <CardDescription>Fill in the details below to submit your requisition.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-6"
                onSubmit={(e) => {
                  e.preventDefault();
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
                        <SelectItem value="training">Training / Course</SelectItem>
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
                      <Input
                        id="organiserName"
                        placeholder="Organiser name"
                        value={organiserName}
                        onChange={(e) => setOrganiserName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="organiserContactPerson">Contact person</Label>
                      <Input
                        id="organiserContactPerson"
                        placeholder="Contact person"
                        value={organiserContactPerson}
                        onChange={(e) => setOrganiserContactPerson(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="organiserAddress">Address</Label>
                      <Textarea
                        id="organiserAddress"
                        placeholder="Organiser address"
                        value={organiserAddress}
                        onChange={(e) => setOrganiserAddress(e.target.value)}
                        className="min-h-24"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="organiserPhone">Phone num</Label>
                      <Input
                        id="organiserPhone"
                        type="tel"
                        placeholder="e.g. +60 12-345 6789"
                        value={organiserPhone}
                        onChange={(e) => setOrganiserPhone(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="organiserEmail">Email</Label>
                      <Input
                        id="organiserEmail"
                        type="email"
                        placeholder="name@company.com"
                        value={organiserEmail}
                        onChange={(e) => setOrganiserEmail(e.target.value)}
                      />
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
                    <div className="grid gap-2">
                      <Label htmlFor="budgetMileage">Mileage</Label>
                      <Input
                        id="budgetMileage"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={budgetMileage}
                        onChange={(e) => setBudgetMileage(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budgetAccommodation">Accommodation</Label>
                      <Input
                        id="budgetAccommodation"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={budgetAccommodation}
                        onChange={(e) => setBudgetAccommodation(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budgetTravelFare">Air / travel fare</Label>
                      <Input
                        id="budgetTravelFare"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={budgetTravelFare}
                        onChange={(e) => setBudgetTravelFare(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="budgetOthers">Others</Label>
                      <Input
                        id="budgetOthers"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={budgetOthers}
                        onChange={(e) => setBudgetOthers(e.target.value)}
                      />
                    </div>

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
                    <Label htmlFor="evidenceFiles">Evidence documents</Label>
                    <Input
                      id="evidenceFiles"
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={(e) => setEvidenceFiles(Array.from(e.target.files ?? []))}
                    />
                    {evidenceFiles.length ? (
                      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Selected</p>
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
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Reset
                  </Button>
                  <Button type="submit">Make Request</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

