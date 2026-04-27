import { PlusCircle, Search, TrendingUp, type LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

const steps: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Search,
    title: "Discover Opportunities",
    desc: "Find workshops, conferences, and training tailored to your academic discipline and career goals.",
  },
  {
    icon: PlusCircle,
    title: "Log Your Activities",
    desc: "Easily record your pedagogical, research, and community service hours with supporting evidence.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    desc: "Monitor your progress toward the annual 40-hour requirement with real-time dashboards.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="container mx-auto">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Three steps to stay on track
          </h2>
          <p className="mt-4 text-muted-foreground">
            A streamlined workflow designed around how academic staff actually develop their practice.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div className="group relative h-full rounded-2xl border border-secondary bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
                <div className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Step {i + 1}
                </div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-xl font-bold text-primary">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
