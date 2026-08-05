import { useEffect, useLayoutEffect, useRef, useState, type TransitionEvent } from "react";

import { Reveal } from "@/components/cpd/Reveal";
import { cn } from "@/lib/utils";

const TRAININGS = [
  {
    id: "als",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    category: "Clinical Skills · Mar 2026",
    title: "Advanced Life Support Recertification",
    detail: "Hands-on ALS workshop for clinical staff across RCMP departments",
  },
  {
    id: "leadership",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    category: "Leadership · Feb 2026",
    title: "Leading High-Performing Clinical Teams",
    detail: "Practical leadership tools for HODs and senior academic staff",
  },
  {
    id: "digital",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    category: "Digital Learning · Jan 2026",
    title: "Digital Teaching & Assessment Methods",
    detail: "Modern approaches to hybrid teaching and student assessment",
  },
  {
    id: "research",
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=80",
    category: "Research · Dec 2025",
    title: "Research Ethics & Publication Pathways",
    detail: "Guidance on ethics approval, manuscript writing, and collaboration",
  },
  {
    id: "wellbeing",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    category: "Staff Wellbeing · Nov 2025",
    title: "Resilience & Workplace Wellbeing",
    detail: "Evidence-based strategies to support staff health and retention",
  },
  {
    id: "quality",
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80",
    category: "Quality Improvement · Oct 2025",
    title: "Patient Safety & Quality Improvement",
    detail: "Applying QI methods to everyday clinical and academic practice",
  },
] as const;

const COUNT = TRAININGS.length;
const LOOP_ITEMS = [...TRAININGS, ...TRAININGS, ...TRAININGS];
const START_INDEX = COUNT;
const INTERVAL_MS = 5000;

export function TrainingShowcase() {
  const [index, setIndex] = useState<number>(START_INDEX);
  const [withTransition, setWithTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const [stepPx, setStepPx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLElement | null>(null);
  const indexRef = useRef(index);

  indexRef.current = index;
  const logicalIndex = ((index % COUNT) + COUNT) % COUNT;

  useLayoutEffect(() => {
    const measure = () => {
      const card = firstCardRef.current;
      const track = trackRef.current;
      if (!card || !track) return;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      setStepPx(card.getBoundingClientRect().width + gap);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (paused || stepPx === 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = window.setInterval(() => {
      setWithTransition(true);
      setIndex((current) => current + 1);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [paused, stepPx]);

  useEffect(() => {
    if (withTransition) return;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setWithTransition(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [withTransition]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    const current = indexRef.current;
    if (current < COUNT * 2) return;
    setWithTransition(false);
    setIndex(current - COUNT);
  };

  const goTo = (targetLogical: number) => {
    setWithTransition(true);
    setIndex(START_INDEX + targetLogical);
  };

  return (
    <section id="training-showcase" className="relative overflow-hidden bg-background py-20 sm:py-28">
      <div className="container mx-auto">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Training Showcase</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Building capability across RCMP
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A selection of recent CPD programmes that help staff grow clinical skills, leadership, and teaching
            excellence.
          </p>
        </Reveal>
      </div>

      <div
        className="relative mt-12 sm:mt-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            onTransitionEnd={handleTransitionEnd}
            className={cn(
              "flex gap-6 sm:gap-8 lg:gap-10",
              withTransition && "transition-transform duration-700 ease-out",
            )}
            style={{
              transform:
                stepPx > 0
                  ? `translate3d(calc(50% - ${stepPx / 2}px - ${index * stepPx}px), 0, 0)`
                  : undefined,
            }}
          >
            {LOOP_ITEMS.map((training, loopIndex) => {
              const isActive = loopIndex === index;
              return (
                <article
                  key={`${training.id}-${loopIndex}`}
                  ref={loopIndex === 0 ? firstCardRef : undefined}
                  className={cn(
                    "w-[min(20rem,72vw)] shrink-0 transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-50",
                  )}
                  aria-hidden={!isActive}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => goTo(loopIndex % COUNT)}
                    aria-label={training.title}
                    tabIndex={isActive ? 0 : -1}
                  >
                    <div className="overflow-hidden rounded-2xl bg-muted">
                      <img
                        src={training.image}
                        alt=""
                        className="aspect-[3/2] h-auto w-full object-cover"
                        loading={loopIndex < COUNT + 2 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </div>
                    <div className="mt-4 space-y-1.5 px-1 sm:mt-5 sm:space-y-2">
                      <p className="text-sm font-semibold text-foreground">{training.category}</p>
                      <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
                        {training.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{training.detail}</p>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="container mx-auto mt-8 flex items-center justify-center gap-2 sm:mt-10">
          {TRAININGS.map((training, dotIndex) => (
            <button
              key={training.id}
              type="button"
              aria-label={`Show ${training.title}`}
              aria-current={dotIndex === logicalIndex}
              onClick={() => goTo(dotIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                dotIndex === logicalIndex ? "w-8 bg-secondary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
