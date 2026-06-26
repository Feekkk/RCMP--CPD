import { FileText, LifeBuoy, Scale, BookOpen } from "lucide-react";

const links = [
  { icon: Scale, label: "University Policies", href: "#" },
  { icon: BookOpen, label: "CPD Handbook (PDF)", href: "#" },
  { icon: LifeBuoy, label: "IT Support Contact", href: "#" },
  { icon: FileText, label: "Privacy & Terms", href: "#" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto py-14 sm:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <img
                src="/rcmp-white.png"
                alt="UniKL RCMP logo"
                width={100}
                height={100}
                className="h-20 w-20 object-contain"
              />
              <div className="leading-tight">
                <p className="font-display text-base font-bold">UniKL RCMP</p>
                <p className="text-xs text-background/70">Continuous Professional Development</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-background/75">
              Universiti Kuala Lumpur RCMP. Supporting professional excellence through continuous
              professional development.
            </p>
          </div>

          <div id="resources" className="lg:mt-2">
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

          <div className="lg:text-right">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-background">
              Get in touch
            </h4>
            <p className="mt-5 text-sm text-background/80">
              Human Capital Office, UniKL RCMP
              <br />
              No. 3, Jalan Greentown
              <br />
              30450 Ipoh, Perak
            </p>
            <a
              href="mailto:hcd@unikl.edu.my"
              className="mt-3 inline-block text-sm font-medium text-secondary hover:underline"
            >
              hcd@unikl.edu.my
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-background/10 pt-6 text-xs text-background/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Universiti Kuala Lumpur RCMP. All rights reserved.</p>
          <p>Created by Information Technology Department RCMP</p>
        </div>
      </div>
    </footer>
  );
};
