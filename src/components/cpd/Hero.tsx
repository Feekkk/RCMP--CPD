import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BADGES = [
  { label: "Plan", color: "bg-secondary" },
  { label: "Submit", color: "bg-primary" },
  { label: "Verify", color: "bg-secondary" },
];

export const Hero = () => {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-background">
      <div className="container relative mx-auto flex flex-1 flex-col pt-28 sm:pt-32 lg:pt-36">
        <div className="flex flex-1 flex-col justify-center py-10 sm:py-14 lg:py-0">
          <div className="max-w-4xl text-left">
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              Human Capital Department Portal
            </p>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem]">
              Empowering Excellence
              <br />
              <span className="text-secondary">Through Training.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-7 sm:text-lg lg:text-xl">
              The official platform for UniKL RCMP staff to plan, submit, and track Continuous
              Professional Development requisitions and annual training hours.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
              <Button
                size="lg"
                className="h-12 rounded-full bg-secondary px-7 text-base font-semibold text-white shadow-none hover:bg-secondary/90 sm:px-8"
                asChild
              >
                <Link to="/login">Staff Login</Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-full bg-muted px-7 text-base font-semibold text-foreground shadow-none hover:bg-muted/80 sm:px-8"
                asChild
              >
                <a href="#faq">Help / FAQ</a>
              </Button>
            </div>

            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80 sm:mt-6 sm:text-xs">
              Plan · Submit · Verify 
            </p>
          </div>
        </div>

        <div className="mt-auto border-y border-border/70 py-5 sm:py-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:gap-x-12">
            {BADGES.map((badge) => (
              <li
                key={badge.label}
                className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs"
              >
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${badge.color}`} />
                {badge.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
