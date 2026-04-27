import { Landmark, ShieldCheck, RefreshCw, type LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: RefreshCw,
    title: "Simple tracking",
    desc: "Log CPD activities quickly with evidence so your record is always current.",
  },
  {
    icon: Landmark,
    title: "Organized categories",
    desc: "Keep activities grouped by approved areas for clearer reporting and audits.",
  },
  {
    icon: ShieldCheck,
    title: "Confident compliance",
    desc: "Stay aligned with requirements using a structured workflow and clear progress checks.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="container mx-auto">
        <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
          <Reveal className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
              CPD workflow
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Experience that grows
              <br />
              with your scale.
            </h2>
          </Reveal>

          <Reveal className="md:justify-self-end">
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Design a simple operating system for CPD that supports planning, evidence collection,
              and clear progress visibility - without breaking your existing routine.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="h-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
