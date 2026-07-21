import {
  ArrowRight,
  Calculator,
  ClipboardCheck,
  FileCheck2,
  MailCheck,
  Plus,
  Printer,
  ShieldCheck
} from "lucide-react";
import { PrintableDocument } from "@/components/generator/output-panel";
import { TrackedLink } from "@/components/tracked-link";
import { createDefaultInput, generateChangeOrder } from "@/lib/change-order";
import { funnelEvents } from "@/lib/funnel";

const workflow = [
  {
    number: "01",
    title: "Capture the change",
    body: "Record the approved scope beside the client’s new request, while the details are still clear.",
    outcome: "One scope record"
  },
  {
    number: "02",
    title: "Price the impact",
    body: "Add labor, materials, markup, disruption, deposit, and any schedule effect in one calculation.",
    outcome: "One defensible total"
  },
  {
    number: "03",
    title: "Send the paperwork",
    body: "Copy the approval message or print a client-ready record before the crew starts the added work.",
    outcome: "One clear decision"
  }
] as const;

const deliverables = [
  {
    icon: Calculator,
    title: "Transparent pricing",
    body: "Labor, materials, markup, rush costs, deposit, and balance are shown separately."
  },
  {
    icon: MailCheck,
    title: "Approval language",
    body: "A direct client message asks for written approval before additional work begins."
  },
  {
    icon: FileCheck2,
    title: "Scope boundaries",
    body: "Original work, added work, exclusions, and schedule impact live in one record."
  },
  {
    icon: Printer,
    title: "Client-ready output",
    body: "Copy the text, download it, or print a polished document to PDF."
  }
] as const;

const faqs = [
  {
    question: "Is ChangeOrderKit a legal contract?",
    answer:
      "No. It creates practical business templates and math checks, not legal advice. Review contract terms and local requirements before relying on them."
  },
  {
    question: "Do I need an account to use the generator?",
    answer:
      "No. You can build, copy, download, and print a document without an account. Sign in when you want to save records to your dashboard."
  },
  {
    question: "Can I use it from a jobsite?",
    answer:
      "Yes. The workflow is designed to work on a phone, tablet, or desktop, so you can record a request while the project details are fresh."
  },
  {
    question: "Does it collect the client’s deposit?",
    answer:
      "Not yet. The current generator calculates the deposit and writes the payment terms, but it does not process or verify payments."
  }
] as const;

function ProductArtifact() {
  const input = {
    ...createDefaultInput(),
    documentTitle: "Coffee bar tile extension",
    businessPhone: "(312) 555-0148",
    client: "Theo Vasquez",
    originalScope: "Install white subway tile on the kitchen’s main backsplash walls.",
    newRequest: "Extend tile behind the coffee bar and use herringbone around the range."
  };
  const generated = generateChangeOrder(input);

  return (
    <figure className="landing-artifact">
      <figcaption className="landing-artifact-caption">
        <span>Client-ready output</span>
        <strong>Example change order</strong>
      </figcaption>
      <div className="landing-artifact-window">
        <PrintableDocument input={input} generated={generated} preview />
      </div>
    </figure>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page no-print">
      <section className="landing-hero tool-shell" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="panel-kicker">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Extra work approval
          </p>
          <h1 id="landing-title" className="landing-hero-title">
            Price extra work
            <br className="hidden lg:block" /> before it starts.
          </h1>
          <p className="landing-hero-dek">
            Turn a client request into a clear price, approval message, and client-ready record in
            minutes.
          </p>
          <div className="landing-hero-actions">
            <TrackedLink
              href="#generator"
              className="btn btn-primary"
              eventName={funnelEvents.homeLandingCtaClicked}
              eventProperties={{ placement: "hero", destination: "generator" }}
            >
              Build a change order
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </TrackedLink>
            <a className="btn btn-secondary" href="#workflow">
              See the workflow
            </a>
          </div>
        </div>

        <ProductArtifact />
      </section>

      <section className="landing-proof-band" aria-label="Product access and output">
        <dl className="tool-shell landing-proof-list">
          <div>
            <dt>Start</dt>
            <dd>No account required</dd>
          </div>
          <div>
            <dt>Draft</dt>
            <dd>Autosaved in this browser</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>Copy, text, print, or PDF</dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>Free generator</dd>
          </div>
        </dl>
      </section>

      <section id="problem" className="tool-shell landing-problem" aria-labelledby="problem-title">
        <div className="landing-section-intro">
          <h2 id="problem-title">A quick yes can turn into a costly argument.</h2>
          <p>
            The dispute usually starts when added work is discussed casually, then documented only
            after the invoice arrives.
          </p>
        </div>

        <div className="workspace-panel landing-problem-sequence">
          <div className="workspace-row landing-sequence-row">
            <span className="landing-sequence-number">01</span>
            <p>“Can you also tile behind the coffee bar?”</p>
            <span>Request</span>
          </div>
          <div className="workspace-row landing-sequence-row">
            <span className="landing-sequence-number">02</span>
            <p>The crew starts before price, deposit, and timing are recorded.</p>
            <span>Risk</span>
          </div>
          <div className="workspace-row landing-sequence-row">
            <span className="landing-sequence-number">03</span>
            <p>The final invoice includes work the client does not remember approving.</p>
            <span>Dispute</span>
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-workflow" aria-labelledby="workflow-title">
        <div className="tool-shell landing-workflow-grid">
          <div className="landing-workflow-intro">
            <p className="panel-kicker">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              The workflow
            </p>
            <h2 id="workflow-title">Make the decision clear while the request is still fresh.</h2>
            <p>
              ChangeOrderKit focuses on the small window between “yes, we can do that” and the
              moment extra work begins.
            </p>
          </div>

          <ol className="landing-process">
            {workflow.map((step) => (
              <li key={step.number}>
                <span className="landing-process-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <strong>{step.outcome}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="output" className="tool-shell landing-output" aria-labelledby="output-title">
        <div className="landing-output-heading">
          <h2 id="output-title">Paperwork your client can understand at a glance.</h2>
          <p>
            The total stands out, the scope stays specific, and the approval request is ready to
            send.
          </p>
        </div>

        <div className="ledger-rail landing-deliverables">
          {deliverables.map(({ icon: Icon, title, body }) => (
            <article key={title} className="landing-deliverable">
              <Icon className="h-5 w-5" aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="tool-shell landing-faq" aria-labelledby="faq-title">
        <div className="landing-faq-heading">
          <h2 id="faq-title">Before you start</h2>
          <p>Clear answers about what the current product does and does not do.</p>
        </div>

        <div className="landing-faq-list">
          {faqs.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>
                <span>{item.question}</span>
                <Plus className="h-5 w-5" aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tool-shell landing-generator-intro" aria-labelledby="generator-intro-title">
        <div>
          <p className="panel-kicker">Build the record</p>
          <h2 id="generator-intro-title">Use a real request from your current job.</h2>
        </div>
        <p>
          Start with the example, replace it with your own details, then copy or print the finished
          document.
        </p>
      </section>
    </div>
  );
}
