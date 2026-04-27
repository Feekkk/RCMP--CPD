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
  { icon: Award, title: "Training & Workshops", desc: "Structured learning sessions, certifications, and industry workshops." },
  { icon: GraduationCap, title: "Academic Qualifications", desc: "Postgraduate study, professional certifications, and accredited programmes." },
  { icon: BookMarked, title: "Self-Directed Studies", desc: "Independent research, MOOCs, journal reading, and reflective practice." },
  { icon: Users, title: "Mentoring", desc: "Supervising students, peer coaching, and academic mentorship roles." },
  { icon: Briefcase, title: "Consultancies", desc: "Industry consultancy, expert panels, and applied advisory work." },
  { icon: HeartHandshake, title: "Community Services", desc: "Outreach programmes, volunteering, and community-driven initiatives." },
];

export const Categories = () => {
  return (
    <section className="relative bg-secondary/25 py-24 sm:py-32">
      <div className="container mx-auto">
        <Reveal className="mx-auto max-w-2xl text-center">
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 100}>
              <div className="group flex h-full items-start gap-5 rounded-2xl border border-secondary bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/60 transition-colors group-hover:bg-primary">
                  <c.icon
                    className="h-6 w-6 text-secondary-foreground/70 transition-colors group-hover:text-primary-foreground"
                    style={{ color: "hsl(var(--secondary))" }}
                    strokeWidth={2.2}
                  />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
