import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail, Plus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/cpd/Reveal";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: ReactNode;
};

type FaqCategory = {
  id: string;
  label: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "getting-started",
    label: "Getting started",
    items: [
      {
        question: "What is the HCD CPD portal?",
        answer: (
          <>
            It is UniKL RCMP&apos;s Human Capital Department platform for staff to plan, submit, track, and complete
            Continuous Professional Development (CPD) requisitions and yearly training hours.
          </>
        ),
      },
      {
        question: "How do I log in?",
        answer: (
          <>
            Click{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Staff Login
            </Link>{" "}
            and sign in with Microsoft SSO using your UniKL staff email. Your profile details are loaded from Microsoft
            Entra after a successful SSO session.
          </>
        ),
      },
      {
        question: "Who can use this system?",
        answer:
          "Staff, Heads of Department (HOD), Human Capital reviewers/admins, and final approvers each have a role-based dashboard with the tools needed for their part of the CPD workflow.",
      },
      {
        question: "I can open the portal but my profile fields are blank. Why?",
        answer:
          "Profile data comes from Microsoft Entra. If you signed in without a full SSO session (or your session expired), fields stay empty until you sign in again with Microsoft SSO.",
      },
      {
        question: "Where do I start after logging in?",
        answer:
          "Use My Dashboard to check your hours and status, then open Requisition to submit a new request, or Track Requisition / History to follow existing ones. Your calendar helps you plan upcoming programmes.",
      },
    ],
  },
  {
    id: "cpd-hours",
    label: "CPD hours & targets",
    items: [
      {
        question: "What is the annual CPD requirement?",
        answer: (
          <>
            Staff are expected to complete{" "}
            <strong className="font-semibold text-foreground">40 hours</strong> of approved CPD each academic year.
            Only completed and verified activities count toward the target.
          </>
        ),
      },
      {
        question: "When do my CPD hours get counted?",
        answer:
          "Hours are counted after the full post-training flow is done — attendance/evidence, e-survey, and HOD evaluation where required — and the requisition is marked completed.",
      },
      {
        question: "What CPD pathways or categories can I claim?",
        answer:
          "There are six approved pathways, covering training and workshops through to community services. Choose the category that best matches the activity when you create a requisition.",
      },
      {
        question: "How do I know if I am on track?",
        answer:
          "Your dashboard shows completed hours for the year and a status such as On-track, Need Attention, or Off-Track so you can see whether you still need more approved CPD.",
      },
      {
        question: "Do rejected requisitions count toward my hours?",
        answer: "No. Rejected or incomplete requisitions do not add CPD hours. Only completed, approved activities are counted.",
      },
    ],
  },
  {
    id: "requisitions",
    label: "Requisitions",
    items: [
      {
        question: "What is a CPD requisition?",
        answer:
          "A requisition is your formal request to attend or claim a CPD programme. It captures programme details, schedule, funding claim information, and supporting documents for approval.",
      },
      {
        question: "How early must I submit a requisition?",
        answer: (
          <>
            Submit at least <strong className="font-semibold text-foreground">1 month</strong> before the earliest
            programme date. Submissions inside that window are treated as urgent.
          </>
        ),
      },
      {
        question: "What happens if my programme is less than one month away?",
        answer:
          "The system flags the requisition as urgent. Urgent requests need approval from the Head of Human Capital Department in addition to the normal workflow checks.",
      },
      {
        question: "Can I save a draft before submitting?",
        answer:
          "Yes. You can save a draft and return later from Track Requisition / History. Drafts are not in the approval queue until you submit them.",
      },
      {
        question: "What information do I need to prepare?",
        answer:
          "Typically: programme title and category, dates and venue, funding claim details, and any required attachments. Incomplete details can delay HOD or HR review.",
      },
      {
        question: "Can I edit a requisition after submitting?",
        answer:
          "Once submitted, editing is limited by status. Use Track Requisition to review remarks. If changes are needed after rejection, update based on feedback and resubmit as guided by HCD or your HOD.",
      },
      {
        question: "How do I track the status of my requisition?",
        answer:
          "Open Track Requisition or History. You can filter by Drafts, Pre-training, Post-training, Completed, or Rejected to see where each request stands.",
      },
    ],
  },
  {
    id: "approvals",
    label: "Approvals",
    items: [
      {
        question: "What is the normal approval workflow?",
        answer: (
          <>
            The standard path is{" "}
            <strong className="font-semibold text-foreground">
              Submission → Head of Department → Human Capital Review → Final Approval
            </strong>
            .
          </>
        ),
      },
      {
        question: "What does my HOD do in the process?",
        answer:
          "Your HOD reviews department requisitions in the Review Queue, then recommends or rejects with remarks. Recommended items move forward to Human Capital review.",
      },
      {
        question: "What does Human Capital / Admin verify?",
        answer:
          "HC reviewers check completeness, policy compliance, and documentation before forwarding verified requisitions for final management approval.",
      },
      {
        question: "Who gives the final approval?",
        answer:
          "Final approvers decide on HR-verified requisitions — approve or reject with remarks. Their decision is recorded on your requisition history.",
      },
      {
        question: "Why was my requisition rejected?",
        answer:
          "Open the requisition details and read the remarks from HOD, HC, or final approval. Common reasons include missing documents, incorrect details, or late/urgent policy issues.",
      },
      {
        question: "How long does approval usually take?",
        answer:
          "Timing depends on each reviewer's queue and how complete your submission is. Submit early, respond to remarks quickly, and follow up with your HOD or HCD if an item is stuck.",
      },
    ],
  },
  {
    id: "post-training",
    label: "Post-training",
    items: [
      {
        question: "What must I do after attending the programme?",
        answer:
          "Complete the post-training checklist: confirm attendance/evidence, submit the e-survey, and ensure any required HOD evaluation is completed so hours can be counted.",
      },
      {
        question: "What is the HOD post-training evaluation?",
        answer:
          "For eligible programmes, your HOD completes an evaluation about three months after attendance. Until that is done, the requisition may stay in post-training.",
      },
      {
        question: "Where do I upload attendance or certificates?",
        answer:
          "Use the Post-Training page linked from your requisition. Upload the evidence requested there and submit the survey before marking the step complete.",
      },
      {
        question: "My training is done but hours still show as pending. Why?",
        answer:
          "Hours stay pending until every required post-training step is finished and the requisition reaches Completed status. Check which checklist items are still open.",
      },
    ],
  },
  {
    id: "roles",
    label: "Roles & dashboards",
    items: [
      {
        question: "What can staff do in the portal?",
        answer:
          "Staff can create requisitions, track approvals, manage post-training evidence, view history, plan via calendar, and monitor yearly CPD progress on the dashboard.",
      },
      {
        question: "What can HODs do?",
        answer:
          "HODs review team requisitions, recommend or reject requests, complete post-training evaluations, view department staff CPD status, and manage their own requisitions.",
      },
      {
        question: "What can admins / HC staff do?",
        answer:
          "Admins manage staff accounts and departments, verify requisitions, monitor compliance reports, and support overall CPD operations for the college.",
      },
      {
        question: "What can final approvers do?",
        answer:
          "Approvers work from the approval dashboard and queue to approve or reject verified requisitions and review management-level CPD reports.",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      {
        question: "Who should I contact for help?",
        answer: (
          <>
            Email the Human Capital Office at{" "}
            <a href="mailto:hcd@unikl.edu.my" className="font-medium text-foreground underline-offset-4 hover:underline">
              hcd@unikl.edu.my
            </a>{" "}
            for CPD policy, approvals, account, or process questions.
          </>
        ),
      },
      {
        question: "I cannot find my department or my details look wrong.",
        answer:
          "Ask HCD/admin to update your staff record. Department and role changes are managed in the admin staff directory and affect approval routing.",
      },
      {
        question: "The page failed to load data. What should I try?",
        answer:
          "Refresh the page, sign out and sign in again with Microsoft SSO, and confirm you are using the main portal URL. If it continues, contact HCD with the page name and time of the error.",
      },
      {
        question: "Is there a bulk way to register staff?",
        answer:
          "Yes. Admins can add users one by one or via bulk upload under Manage Staff. New users should then sign in with Microsoft SSO using the registered email.",
      },
    ],
  },
];

export const Faq = () => {
  const [activeCategoryId, setActiveCategoryId] = useState(FAQ_CATEGORIES[0].id);
  const activeCategory = FAQ_CATEGORIES.find((category) => category.id === activeCategoryId) ?? FAQ_CATEGORIES[0];

  return (
    <section id="faq" className="relative overflow-hidden border-y bg-background py-20 sm:py-28">
      <div className="container relative mx-auto">
        <div className="grid gap-12 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.35fr)] lg:gap-16 xl:gap-24">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">FAQs</h2>

            <a
              href="mailto:hcd@unikl.edu.my"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Contact Human Capital
            </a>

            <nav aria-label="FAQ categories" className="mt-10 hidden lg:block">
              <ul className="space-y-1">
                {FAQ_CATEGORIES.map((category) => {
                  const active = category.id === activeCategory.id;
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId(category.id)}
                        className={cn(
                          "flex w-full items-center gap-3 py-2 text-left text-base transition-colors",
                          active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 shrink-0 text-center text-sm",
                            active ? "text-foreground" : "text-transparent",
                          )}
                          aria-hidden
                        >
                          —
                        </span>
                        {category.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-8 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FAQ_CATEGORIES.map((category) => {
                  const active = category.id === activeCategory.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategoryId(category.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="min-w-0">
            <div className="mb-2 flex items-baseline gap-3">
              <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {activeCategory.label}
              </h3>
              <span className="text-sm text-muted-foreground">{activeCategory.items.length}</span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {activeCategory.items.map((faq, index) => (
                <AccordionItem
                  key={`${activeCategory.id}-${faq.question}`}
                  value={`${activeCategory.id}-${index}`}
                  className="border-border"
                >
                  <AccordionTrigger className="group gap-4 py-5 text-left hover:no-underline [&>svg:last-child]:hidden">
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="pr-2 text-base font-normal leading-snug text-foreground sm:text-[1.05rem]">
                        {faq.question}
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-foreground transition-transform duration-200 group-data-[state=open]:rotate-45" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
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
