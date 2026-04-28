import * as React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { StaffSidebar } from "@/staff/Sidebar";

type ProgrammeSlot = {
  date: string;
  from: string;
  to: string;
};

export function Requisition() {
  const [category, setCategory] = React.useState<string>("");
  const [justification, setJustification] = React.useState<string>("");

  const [programmeTitle, setProgrammeTitle] = React.useState<string>("");
  const [programmeSlots, setProgrammeSlots] = React.useState<ProgrammeSlot[]>([{ date: "", from: "", to: "" }]);
  const [programmeVenue, setProgrammeVenue] = React.useState<string>("");
  const [programmeFees, setProgrammeFees] = React.useState<string>("");
  const [hrdcClaimable, setHrdcClaimable] = React.useState<boolean>(false);

  const [organiserName, setOrganiserName] = React.useState<string>("");
  const [organiserAddress, setOrganiserAddress] = React.useState<string>("");
  const [organiserPhone, setOrganiserPhone] = React.useState<string>("");
  const [organiserEmail, setOrganiserEmail] = React.useState<string>("");
  const [organiserContactPerson, setOrganiserContactPerson] = React.useState<string>("");

  const [budgetFees, setBudgetFees] = React.useState<string>("");
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

    return n(budgetFees) + n(budgetMileage) + n(budgetAccommodation) + n(budgetTravelFare) + n(budgetOthers);
  }, [budgetAccommodation, budgetFees, budgetMileage, budgetOthers, budgetTravelFare]);

  const resetForm = () => {
    setCategory("");
    setJustification("");
    setProgrammeTitle("");
    setProgrammeSlots([{ date: "", from: "", to: "" }]);
    setProgrammeVenue("");
    setProgrammeFees("");
    setHrdcClaimable(false);
    setOrganiserName("");
    setOrganiserAddress("");
    setOrganiserPhone("");
    setOrganiserEmail("");
    setOrganiserContactPerson("");
    setBudgetFees("");
    setBudgetMileage("");
    setBudgetAccommodation("");
    setBudgetTravelFare("");
    setBudgetOthers("");
    setEvidenceFiles([]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StaffSidebar />
      <div className="md:pl-72">
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Staff</p>
                <h1 className="font-display text-2xl font-bold tracking-tight">Requisition</h1>
              </div>
              <Button type="button" onClick={resetForm}>
                <FileText className="h-4 w-4" />
                New Requisition
              </Button>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>CPD Requisition Form</CardTitle>
                <CardDescription>Fill in the details below to submit your CPD requisition.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <section className="grid gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold tracking-tight">1. Categories</h2>
                        <p className="text-sm text-muted-foreground">Select the requisition category.</p>
                      </div>
                    </div>

                    <div className="grid gap-2 md:max-w-md">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Training / Course</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
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

                      <div className="md:col-span-2 grid gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <Label>Schedule (date + hour to hour)</Label>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setProgrammeSlots((prev) => [...prev, { date: "", from: "", to: "" }])}
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>

                        <div className="grid gap-3">
                          {programmeSlots.map((slot, idx) => (
                            <div key={idx} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12">
                              <div className="grid gap-2 md:col-span-4">
                                <Label htmlFor={`slotDate-${idx}`}>Date</Label>
                                <Input
                                  id={`slotDate-${idx}`}
                                  type="date"
                                  value={slot.date}
                                  onChange={(e) =>
                                    setProgrammeSlots((prev) =>
                                      prev.map((s, i) => (i === idx ? { ...s, date: e.target.value } : s)),
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-2 md:col-span-3">
                                <Label htmlFor={`slotFrom-${idx}`}>From</Label>
                                <Input
                                  id={`slotFrom-${idx}`}
                                  type="time"
                                  value={slot.from}
                                  onChange={(e) =>
                                    setProgrammeSlots((prev) =>
                                      prev.map((s, i) => (i === idx ? { ...s, from: e.target.value } : s)),
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-2 md:col-span-3">
                                <Label htmlFor={`slotTo-${idx}`}>To</Label>
                                <Input
                                  id={`slotTo-${idx}`}
                                  type="time"
                                  value={slot.to}
                                  onChange={(e) =>
                                    setProgrammeSlots((prev) =>
                                      prev.map((s, i) => (i === idx ? { ...s, to: e.target.value } : s)),
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-end md:col-span-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full text-muted-foreground hover:text-foreground"
                                  disabled={programmeSlots.length === 1}
                                  onClick={() => setProgrammeSlots((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-2 md:sr-only">Remove</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
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

                      <div className="grid gap-2">
                        <Label htmlFor="programmeFees">Fees</Label>
                        <Input
                          id="programmeFees"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={programmeFees}
                          onChange={(e) => setProgrammeFees(e.target.value)}
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox checked={hrdcClaimable} onCheckedChange={(v) => setHrdcClaimable(Boolean(v))} />
                          HRDC claimable
                        </label>
                      </div>
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
                      <h2 className="text-sm font-semibold tracking-tight">5. Request budget (optional)</h2>
                      <p className="text-sm text-muted-foreground">Leave blank if not applicable.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="budgetFees">Fees</Label>
                        <Input
                          id="budgetFees"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={budgetFees}
                          onChange={(e) => setBudgetFees(e.target.value)}
                        />
                      </div>
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
                      <h2 className="text-sm font-semibold tracking-tight">6. Upload document (evidence)</h2>
                      <p className="text-sm text-muted-foreground">Upload supporting documents (optional).</p>
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

