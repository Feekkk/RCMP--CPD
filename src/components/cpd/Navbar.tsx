import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="container mx-auto flex items-center justify-between py-4 sm:py-5">
        <a href="https://rcmp.unikl.edu.my" className="flex items-center gap-2 sm:gap-3">
          <img
            src="/rcmp-real.png"
            alt="UniKL RCMP logo"
            width={280}
            height={280}
            className="h-16 w-16 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
            loading="eager"
            decoding="async"
          />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground sm:text-base">UniKL RCMP</p>
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">CPD Portal</p>
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
          <Button size="lg" className="h-10 px-4 text-sm shadow-card sm:h-11 sm:px-6 sm:text-base" asChild>
            <Link to="/login">Staff Login</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};
