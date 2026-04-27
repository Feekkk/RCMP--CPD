import { GraduationCap, FileText, LifeBuoy, Scale, BookOpen } from "lucide-react";

const links = [
  { icon: Scale, label: "University Policies", href: "#" },
  { icon: BookOpen, label: "CPD Handbook (PDF)", href: "#" },
  { icon: LifeBuoy, label: "IT Support Contact", href: "#" },
  { icon: FileText, label: "Privacy & Terms", href: "#" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-base font-bold">UniKL RCMP</p>
                <p className="text-xs text-background/70">CPD Portal</p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-background/75">
              Universiti Kuala Lumpur — Royal College of Medicine Perak. Supporting academic
              excellence through continuous professional development.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-background">
              Resources
            </h4>
            <ul className="mt-5 space-y-3">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="group inline-flex items-center gap-2.5 text-sm text-background/80 transition-colors hover:text-secondary"
                  >
                    <l.icon className="h-4 w-4 text-secondary" />
                    <span className="border-b border-transparent group-hover:border-secondary">
                      {l.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-background">
              Get in touch
            </h4>
            <p className="mt-5 text-sm text-background/80">
              CPD Office, UniKL RCMP<br />
              No. 3, Jalan Greentown<br />
              30450 Ipoh, Perak
            </p>
            <a
              href="mailto:cpd@unikl.edu.my"
              className="mt-3 inline-block text-sm font-medium text-secondary hover:underline"
            >
              cpd@unikl.edu.my
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-background/10 pt-6 text-xs text-background/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Universiti Kuala Lumpur RCMP. All rights reserved.</p>
          <p>Built for academic staff · v1.0</p>
        </div>
      </div>
    </footer>
  );
};
