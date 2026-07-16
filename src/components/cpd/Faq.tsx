import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "What is the annual CPD requirement?",
    answer: (
      <>
        UniKL RCMP staff are required to complete{" "}
        <strong className="font-semibold text-foreground">40 hours</strong> of Continuous
        Professional Development each year. All approved pathways count toward this target.
      </>
    ),
  },
  {
    question: "How many approved categories are there?",
    answer: (
      <>
        There are <strong className="font-semibold text-foreground">six approved pathways</strong> —
        from training and workshops to community services. Log activities under the category that
        best fits your work.
      </>
    ),
  },
  {
    question: "Who should I contact for help?",
    answer: (
      <>
        Reach the Human Capital Office at{" "}
        <a href="mailto:hcd@unikl.edu.my" className="font-medium text-primary hover:underline">
          hcd@unikl.edu.my
        </a>
        . They can assist with CPD policies, approvals, and general enquiries.
      </>
    ),
  },
  {
    question: "How do I log in to the portal?",
    answer: (
      <>
        Use the{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Staff Login
        </Link>{" "}
        button in the navigation bar. You will need your UniKL staff credentials to access your CPD
        record.
      </>
    ),
  },
];

export const Faq = () => {
  return (
    <section id="faq" className="relative overflow-hidden border-y bg-secondary/30 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, hsl(var(--primary) / 0.12), transparent 42%), radial-gradient(circle at 88% 72%, hsl(var(--secondary) / 0.55), transparent 48%)",
        }}
      />

      <div className="container relative mx-auto">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-24">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
              Help / FAQ
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to know about CPD
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Short answers on hours, pathways, access, and support — so you can focus on your
              professional development.
            </p>

            <a
              href="mailto:hcd@unikl.edu.my"
              className="group mt-8 inline-flex items-center gap-3 border-t border-primary/20 pt-6 text-sm transition-colors hover:text-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-105">
                <Mail className="h-4 w-4" />
              </span>
              <span className="text-left">
                <span className="block font-medium text-foreground">Still need help?</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-primary">
                  hcd@unikl.edu.my
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>
          </Reveal>

          <Reveal delay={120}>
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${i}`}
                  className="border-primary/15 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline [&[data-state=open]]:text-primary">
                    <span className="flex min-w-0 items-start gap-4">
                      <span className="mt-0.5 font-display text-sm font-bold tabular-nums text-primary/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {faq.question}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-10 text-sm leading-relaxed text-muted-foreground sm:pl-12 sm:text-[0.95rem]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
