import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-secondary/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="container relative mx-auto text-center">
        <div className="mx-auto inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Academic Year 2025 / 2026
        </div>

        <h1
          className="mx-auto mt-6 max-w-4xl animate-fade-in-up font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Empowering Your <span className="text-primary">Academic Journey.</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg text-muted-foreground"
          style={{ animationDelay: "160ms" }}
        >
          The central hub for UniKL RCMP academic staff to track, discover, and manage your
          40 hours of Continuous Professional Development.
        </p>

        <div
          className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Button size="lg" className="group h-12 px-7 text-base shadow-elegant">
            Log In to Your Portal
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-2 border-primary px-7 text-base text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Explore CPD Guidelines
          </Button>
        </div>

        <div
          className="mx-auto mt-16 grid max-w-3xl animate-fade-in-up grid-cols-3 gap-6 border-t border-primary/15 pt-8 text-left sm:gap-10"
          style={{ animationDelay: "320ms" }}
        >
          {[
            { k: "40h", v: "Annual CPD requirement" },
            { k: "6", v: "Approved categories" },
            { k: "100%", v: "Online tracking" },
          ].map((s) => (
            <div key={s.k}>
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
