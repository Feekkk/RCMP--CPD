import { GraduationCap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="container mx-auto flex items-center justify-between py-5">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-foreground">UniKL RCMP</p>
            <p className="text-xs font-medium text-muted-foreground">CPD Portal</p>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-5">
          <a
            href="#faq"
            className="hidden items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:inline-flex"
          >
            <HelpCircle className="h-4 w-4" />
            Help / FAQ
          </a>
          <Button size="lg" className="shadow-card">
            Staff Login
          </Button>
        </div>
      </nav>
    </header>
  );
};
