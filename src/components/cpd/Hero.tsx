import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Layers3,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="container relative mx-auto">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16">
          {/* Narrative */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Journey for Professional Excellence
            </div>

            <div className="relative mt-7">
              <div
                aria-hidden
                className="absolute -left-3 top-4 h-20 w-4/5 rounded-2xl bg-secondary/50"
              />
              <h1 className="relative font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Empowering Excellent
                <span className="text-primary"> Through Training.</span>
              </h1>
            </div>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Track, plan, and manage Continuous Professional Development for UniKL RCMP staff —
              simple, organized, and always up to date.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="group h-12 px-7 text-base shadow-elegant" asChild>
                <Link to="/login">
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="h-12 px-7 text-base" asChild>
                <a href="#resources">
                  <BookOpen className="mr-1 h-4 w-4" />
                  View Guidelines
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="font-medium text-foreground">5.0 for Services & Training</span>
              </div>
              <span className="hidden text-muted-foreground/40 sm:inline">·</span>
              <span>400+ Staff Registered</span>
            </div>
          </div>

          {/* Stats composition */}
          <div className="relative lg:w-1/2">
            <p
              aria-hidden
              className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 font-display text-[8rem] font-extrabold leading-none text-primary/10 sm:text-[9rem]"
            >
              40h
            </p>

            <div className="relative space-y-4">
              {/* Top row — progress + headline stat */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className="flex-1 rounded-2xl border bg-card p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your progress
                  </p>
                  <p className="mt-2 font-display text-4xl font-bold text-foreground">
                    28<span className="text-xl text-muted-foreground">/40h</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/50">
                    <div className="h-full w-[70%] rounded-full bg-primary" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">12 hours remaining this year</p>
                </div>

                <div className="flex w-full flex-col justify-center rounded-2xl border bg-primary/10 p-5 sm:w-36 sm:shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground">Annual target</p>
                  <p className="mt-1 font-display text-5xl font-extrabold text-foreground">40h</p>
                  <p className="mt-1 text-xs text-muted-foreground">CPD requirement</p>
                </div>
              </div>

              {/* Bottom row — three compact stats */}
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[140px] flex-1 rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers3 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">Programs</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">100+</p>
                  <p className="text-xs text-muted-foreground">Providers</p>
                </div>

                <div className="min-w-[140px] flex-1 rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">This month</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">195+</p>
                  <p className="flex items-center gap-1 text-xs font-medium text-primary">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                  </p>
                </div>

                <div className="min-w-[140px] flex-1 rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">Pathways</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">6+</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>

              <p className="max-w-sm pl-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Progress visibility</span> — one
                place for targets, evidence, and status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
