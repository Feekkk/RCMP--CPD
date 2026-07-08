import { ArrowRight, BookOpen, ClipboardCheck, ShieldCheck, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    icon: Target,
    label: "Plan",
    description: "Set and track your annual 40-hour CPD target.",
  },
  {
    icon: ClipboardCheck,
    label: "Submit",
    description: "Requisition programmes through a structured approval workflow.",
  },
  {
    icon: ShieldCheck,
    label: "Verify",
    description: "HOD, HR, and management review every submission.",
  },
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden border-b bg-background pt-28 pb-16 sm:pt-36 sm:pb-20">
      <div className="container relative mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Human Capital Department
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Empowering Excellence <span className="text-primary">Through Training</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The official platform for UniKL RCMP staff to plan, submit, and track Continuous
            Professional Development requisitions and annual training hours.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="group h-12 px-7 text-base" asChild>
              <Link to="/login">
                Staff Login
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
              <a href="#faq">
                <BookOpen className="mr-1 h-4 w-4" />
                View Guidelines
              </a>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.label} className="rounded-xl border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <pillar.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-base font-semibold text-foreground">{pillar.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
