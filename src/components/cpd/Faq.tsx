import type { ReactNode } from "react";
import { Link } from "react-router-dom";
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
    <section id="faq" className="bg-background py-20 sm:py-28">
      <div className="container mx-auto">
        <Reveal className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Help / FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Quick answers
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-col gap-5 sm:mt-14 lg:flex-row lg:flex-wrap">
          {faqs.map((faq, i) => (
            <Reveal
              key={faq.question}
              delay={i * 80}
              className={`w-full lg:w-[calc(50%-0.625rem)] ${i % 2 === 1 ? "lg:mt-8" : ""}`}
            >
              <div className="h-full rounded-2xl border bg-card p-5 shadow-card sm:p-6">
                <h3 className="font-display text-base font-bold text-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
