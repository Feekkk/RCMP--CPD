import {
  Award,
  BookMarked,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./Reveal";

const categories: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Award,
    title: "Training & Workshops",
    desc: "Structured learning sessions, certifications, and industry workshops.",
  },
  {
    icon: GraduationCap,
    title: "Academic Qualifications",
    desc: "Postgraduate study, professional certifications, and accredited programmes.",
  },
  {
    icon: BookMarked,
    title: "Self-Directed Studies",
    desc: "Independent research, MOOCs, journal reading, and reflective practice.",
  },
  {
    icon: Users,
    title: "Mentoring",
    desc: "Supervising students, peer coaching, and academic mentorship roles.",
  },
  {
    icon: Briefcase,
    title: "Consultancies",
    desc: "Industry consultancy, expert panels, and applied advisory work.",
  },
  {
    icon: HeartHandshake,
    title: "Community Services",
    desc: "Outreach programmes, volunteering, and community-driven initiatives.",
  },
];

export const Categories = () => {
  const left = categories.slice(0, 3);
  const right = categories.slice(3);

  return (
    <section className="relative overflow-hidden bg-secondary/25 py-20 sm:py-28">
      <div className="container relative mx-auto">
        <p
          aria-hidden
          className="pointer-events-none absolute -right-4 top-24 font-display text-[7rem] font-extrabold leading-none text-primary/10 sm:text-[9rem] lg:top-32"
        >
          40h
        </p>

        <Reveal className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Approved Pathways
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Six ways to grow your CPD
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every category contributes toward your 40-hour annual requirement. Choose the paths
            that match your professional development goals.
          </p>
        </Reveal>

        <div className="relative z-10 mt-14 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:gap-16">
          <div className="flex flex-1 flex-col gap-5">
            {left.map((c, i) => (
              <Reveal key={c.title} delay={i * 80}>
                <CategoryTile category={c} />
              </Reveal>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-5 lg:pt-14">
            {right.map((c, i) => (
              <Reveal key={c.title} delay={(i + 3) * 80}>
                <CategoryTile category={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

function CategoryTile({ category: c }: { category: (typeof categories)[number] }) {
  return (
    <div className="group rounded-2xl border border-secondary bg-card p-5 shadow-card transition-colors hover:border-primary sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10">
          <c.icon className="h-5 w-5 text-secondary" strokeWidth={2.4} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">{c.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
        </div>
      </div>
    </div>
  );
}
