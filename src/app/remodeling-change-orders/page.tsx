import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";
import { getPilotState } from "@/lib/change-order";
import { funnelEvents } from "@/lib/funnel";

export const metadata: Metadata = {
  title: "Change Orders for Kitchen and Bath Remodelers",
  description:
    "Price extra remodeling work, document the scope change, and get written client approval before your crew continues.",
  openGraph: {
    title: "Change orders for small remodeling teams",
    description:
      "Turn an onsite client request into a priced, written approval record before the extra work begins.",
    type: "website"
  }
};

const problems = [
  {
    heading: "The request happens onsite",
    body: "A homeowner asks the crew for one more wall, fixture, finish, or layout change while work is already moving."
  },
  {
    heading: "The price stays in a text thread",
    body: "Labor, material, schedule, and deposit details end up split across messages instead of one clear record."
  },
  {
    heading: "The invoice becomes the argument",
    body: "If approval was vague, the extra charge can feel like a surprise even when the homeowner requested the work."
  }
];

const steps = [
  "Record the original scope and the homeowner's added request.",
  "Calculate labor, materials, markup, disruption, and deposit.",
  "Send clear approval language before the crew starts the extra work."
];

export default function RemodelingChangeOrdersPage() {
  const pilotState = getPilotState(
    process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK
  );

  return (
    <>
      <section className="tool-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.65fr)] lg:items-center lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-bold text-teal-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            For small kitchen and bath remodeling teams
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Price homeowner changes before they become unpaid work.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Turn an onsite request into a clear added scope, price, deposit, and written approval
            record before your crew continues.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="/#generator"
              className="btn btn-primary"
              eventName={funnelEvents.remodelingLandingCtaClicked}
              eventProperties={{ placement: "hero", destination: "generator" }}
            >
              Price an extra-work request
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </TrackedLink>
            <a className="btn btn-secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Free generator. No account required. Your draft stays in your browser.
          </p>
        </div>

        <aside className="utility-panel p-5 sm:p-6" aria-label="Ideal customer profile">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-800">
            Built for the gap before the invoice
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Keep the project moving without relying on a handshake.
          </h2>
          <ul className="mt-5 grid gap-4 text-sm leading-6 text-slate-700">
            {[
              "One written record of the old scope and new request",
              "A transparent price and deposit calculation",
              "Client-ready approval language you can copy or print"
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-y border-slate-200 bg-white/70 py-12" aria-labelledby="problem-title">
        <div className="tool-shell">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-800">
            The expensive moment
          </p>
          <h2 id="problem-title" className="mt-2 max-w-3xl text-3xl font-black text-slate-950">
            Scope disputes usually start before the extra work—not when the invoice arrives.
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {problems.map((problem) => (
              <article key={problem.heading} className="utility-panel p-5">
                <h3 className="text-lg font-black text-slate-950">{problem.heading}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{problem.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="tool-shell scroll-mt-6 py-14" aria-labelledby="steps-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-800">
              Three-minute workflow
            </p>
            <h2 id="steps-title" className="mt-2 text-3xl font-black text-slate-950">
              From “Can you also…” to a defensible project record.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              ChangeOrderKit is deliberately smaller than field-service software. It focuses on
              the one decision that must be clear before additional work begins.
            </p>
          </div>
          <ol className="grid gap-4">
            {steps.map((step, index) => (
              <li key={step} className="utility-panel flex gap-4 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 font-mono text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-base font-semibold leading-7 text-slate-800">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="tool-shell pb-14">
        <div className="utility-panel grid gap-6 border-teal-200 bg-teal-50/80 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-teal-800">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Paid pilot
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Help shape client approval links for remodelers.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              We are validating a workflow where homeowners review the change, sign, and handle
              the required deposit from one mobile-friendly link. The current free generator does
              not claim to provide that capability yet.
            </p>
          </div>
          {pilotState.configured ? (
            <TrackedLink
              href={pilotState.href}
              className="btn btn-primary"
              eventName={funnelEvents.pilotCtaClicked}
              eventProperties={{ source: "remodeling_landing" }}
              target="_blank"
              rel="noreferrer"
            >
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              {pilotState.label}
            </TrackedLink>
          ) : (
            <span className="btn btn-disabled" aria-disabled="true">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              {pilotState.label}
            </span>
          )}
        </div>
      </section>
    </>
  );
}

