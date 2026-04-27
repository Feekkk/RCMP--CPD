import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Layers3,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div aria-hidden className="absolute inset-0">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-muted/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-40 h-[520px] w-[520px] rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="container relative mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Journey for Professional Excellence
          </div>

          <h1 className="mx-auto mt-7 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
            Empowering Excellent<span className="text-primary"> Through Training.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Track, plan, and manage Continuous Professional Development for UniKL RCMP
            staff - simple, organized, and always up to date.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="group h-12 px-7 text-base shadow-elegant">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="secondary" className="h-12 px-7 text-base">
              <BookOpen className="mr-1 h-4 w-4" />
              View Guidelines
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="font-medium text-foreground">5.0 for Services & Training</span>
            </div>
            <span className="text-muted-foreground/50">|</span>
            <span>400+ Staff Registered</span>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-2xl border bg-muted/20 p-5 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative">
              <p className="text-xs font-semibold text-muted-foreground">Highlights</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-foreground">40h</p>
              <p className="mt-1 text-sm text-muted-foreground">Annual CPD requirement</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-background p-5 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers3 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Partners</span>
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-foreground">100+</p>
            <p className="mt-1 text-sm text-muted-foreground">Programs & providers</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-background p-5 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">This month</span>
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-foreground">195+</p>
            <p className="mt-1 text-sm text-muted-foreground">Hours logged</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              +12% increase
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-primary/10 p-5 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Experience</span>
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-foreground">6+</p>
            <p className="mt-1 text-sm text-muted-foreground">Approved categories</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-foreground/5 p-5 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent" />
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 text-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-foreground">
                Achieve optimal
                <br />
                progress visibility
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                A single place for targets, evidence, and status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
