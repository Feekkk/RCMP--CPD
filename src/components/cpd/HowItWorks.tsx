import { Landmark, ShieldCheck, RefreshCw, type LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

const features: {
  icon: LucideIcon;
  title: string;
  desc: string;
  step: string;
  offset: string;
  variant: "plain" | "card" | "accent";
}[] = [
  {
    icon: RefreshCw,
    title: "Simple tracking",
    desc: "Log CPD activities quickly with evidence so your record is always current.",
    step: "01",
    offset: "lg:pr-24",
    variant: "plain",
  },
  {
    icon: Landmark,
    title: "Organized categories",
    desc: "Keep activities grouped by approved areas for clearer reporting and audits.",
    step: "02",
    offset: "lg:pl-24",
    variant: "card",
  },
  {
    icon: ShieldCheck,
    title: "Confident compliance",
    desc: "Stay aligned with requirements using a structured workflow and clear progress checks.",
    step: "03",
    offset: "lg:pl-8",
    variant: "accent",
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="container mx-auto">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
              CPD workflow
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Experience that grows
              <br />
              with your scale.
            </h2>
          </Reveal>

          <Reveal delay={100} className="max-w-md lg:pb-1">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Design a simple operating system for CPD that supports planning, evidence collection,
              and clear progress visibility — without breaking your existing routine.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 space-y-10 sm:mt-20 sm:space-y-14">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} className={f.offset}>
              <div
                className={
                  f.variant === "card"
                    ? "rounded-2xl border bg-card p-6 shadow-card sm:p-8"
                    : f.variant === "accent"
                      ? "border-l-2 border-primary py-1 pl-6 sm:pl-8"
                      : ""
                }
              >
                <div className="flex gap-5 sm:gap-6">
                  <span className="font-display text-3xl font-bold leading-none text-primary/25 sm:text-4xl">
                    {f.step}
                  </span>
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
