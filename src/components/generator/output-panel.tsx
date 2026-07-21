import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Printer
} from "lucide-react";
import type { Ref } from "react";
import {
  businessInitials,
  type ChangeOrderInput,
  type DocumentType,
  documentTypeLabel,
  formatDate,
  formatMoney,
  type GeneratedChangeOrder
} from "@/lib/change-order";

export type OutputMode = "document" | "email" | "invoice" | "follow-up";

const outputModes: Array<{ value: OutputMode; label: string }> = [
  { value: "document", label: "Document" },
  { value: "email", label: "Email" },
  { value: "invoice", label: "Invoice note" },
  { value: "follow-up", label: "Follow-up" }
];

export function outputText(generated: GeneratedChangeOrder, mode: OutputMode) {
  if (mode === "email") return generated.clientEmail;
  if (mode === "invoice") return generated.invoiceNote;
  if (mode === "follow-up") return generated.followUpTemplate;
  return generated.primaryDocument;
}

export function outputFilename(mode: OutputMode, documentType: DocumentType) {
  const names: Record<OutputMode, string> = {
    document: `${documentType}-document.txt`,
    email: `${documentType}-email.txt`,
    invoice: `${documentType}-invoice-note.txt`,
    "follow-up": `${documentType}-follow-up.txt`
  };

  return names[mode];
}

export function PrintableDocument({
  input,
  generated,
  preview = false
}: {
  input: ChangeOrderInput;
  generated: GeneratedChangeOrder;
  preview?: boolean;
}) {
  const isChangeOrder = input.documentType === "change-order";
  const isServiceAgreement = input.documentType === "service-agreement";
  const label = documentTypeLabel(input.documentType);

  return (
    <div className="print-document" aria-label={`Printable ${label.toLowerCase()} document`}>
      <header className="print-document-header">
        <div>
          <p className="print-kicker">{label}</p>
          <h2>{generated.documentTitle}</h2>
        </div>
        <div className="print-business">
          <span className="print-document-mark" aria-hidden="true">
            {businessInitials(input.provider)}
          </span>
          <div className="print-business-copy">
            <strong>{input.provider || "Your business"}</strong>
            <span>{input.businessEmail || "Email not provided"}</span>
            <span>{input.businessPhone || "Phone not provided"}</span>
          </div>
        </div>
      </header>

      <div className="print-meta-grid">
        <div>
          <span>Client</span>
          <strong>{input.client || "Client"}</strong>
        </div>
        <div>
          <span>Project</span>
          <strong>{input.project || "Project"}</strong>
        </div>
        {!isChangeOrder ? (
          <div>
            <span>Job location</span>
            <strong>{input.jobLocation || "Location not provided"}</strong>
          </div>
        ) : null}
        <div>
          <span>Approval deadline</span>
          <strong>{formatDate(input.approvalDeadline)}</strong>
        </div>
      </div>

      {isChangeOrder ? (
        <section>
          <h3>Original approved scope</h3>
          <p>{input.originalScope || "Original scope not provided."}</p>
        </section>
      ) : null}

      <section>
        <h3>{isChangeOrder ? "Requested added work" : "Scope of work"}</h3>
        <p>{input.newRequest || "Scope of work not provided."}</p>
      </section>

      {!preview ? (
        <section>
          <h3>{isChangeOrder ? "Schedule impact" : "Schedule"}</h3>
          <p>
            {input.scheduleImpact ||
              (input.startDate || input.endDate
                ? `${input.startDate || "Start TBD"} to ${input.endDate || "completion TBD"}`
                : "Schedule will be confirmed after approval.")}
          </p>
        </section>
      ) : null}

      {!isChangeOrder ? (
        <section>
          <h3>Client responsibilities</h3>
          <p>{input.clientResponsibilities || "Client responsibilities not provided."}</p>
        </section>
      ) : null}

      <section>
        <h3>Pricing</h3>
        <table>
          <tbody>
            <tr>
              <th scope="row">Labor</th>
              <td>{formatMoney(generated.breakdown.labor, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Materials and direct costs</th>
              <td>{formatMoney(generated.breakdown.materials, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Markup + overhead allowance</th>
              <td>{formatMoney(generated.breakdown.marginAmount, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Rush + disruption fee</th>
              <td>{formatMoney(generated.breakdown.rushAmount, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Deposit</th>
              <td>{formatMoney(generated.breakdown.depositAmount, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Balance</th>
              <td>{formatMoney(generated.breakdown.balanceAmount, input.currency)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="total-row">
          <dt>Total</dt>
          <dd>{formatMoney(generated.breakdown.total, input.currency)}</dd>
        </dl>
      </section>

      {isServiceAgreement && !preview ? (
        <>
          <section>
            <h3>Changes to scope</h3>
            <p>{input.changePolicy || "Changes must be approved in writing before scheduling."}</p>
          </section>
          <section>
            <h3>Cancellation</h3>
            <p>{input.cancellationTerms || "Cancellation terms should be reviewed before use."}</p>
          </section>
        </>
      ) : null}

      {!preview ? (
        <>
          <section>
            <h3>Payment terms</h3>
            <p>{generated.paymentTerms}</p>
          </section>

          <section>
            <h3>Scope boundary</h3>
            <p>{input.exclusions || "No additional exclusions listed."}</p>
            <p>{generated.approvalText}</p>
            {isServiceAgreement ? (
              <p>
                This service agreement starter is a business template, not legal advice. Have legal
                terms reviewed for your location and trade.
              </p>
            ) : null}
          </section>

          <section className="signature-grid">
            <div>
              <span>Client name</span>
              <i />
            </div>
            <div>
              <span>Signature</span>
              <i />
            </div>
            <div>
              <span>Date</span>
              <i />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

type Props = {
  outputRef: Ref<HTMLDivElement>;
  input: ChangeOrderInput;
  generated: GeneratedChangeOrder;
  outputMode: OutputMode;
  setOutputMode: (mode: OutputMode) => void;
  hasBlankOutput: boolean;
  selectedOutput: string;
  documentLabelLower: string;
  actionGridClass: string;
  copyDocument: () => void;
  downloadText: () => void;
  printDocument: () => void;
  showKitUpsell: boolean;
  kitHref: string;
  handleKitClick: () => void;
  showPilotUpsell: boolean;
  pilotHref: string;
  pilotLabel: string;
  handlePilotClick: () => void;
  toast: string;
};

export function OutputPanel({
  outputRef,
  input,
  generated,
  outputMode,
  setOutputMode,
  hasBlankOutput,
  selectedOutput,
  documentLabelLower,
  actionGridClass,
  copyDocument,
  downloadText,
  printDocument,
  showKitUpsell,
  kitHref,
  handleKitClick,
  showPilotUpsell,
  pilotHref,
  pilotLabel,
  handlePilotClick,
  toast
}: Props) {
  return (
    <section
      ref={outputRef}
      className="utility-panel print-area p-4 sm:p-5 xl:sticky xl:top-24 xl:self-start"
    >
      <div className="no-print mb-5">
        <div>
          <p className="panel-kicker">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Client-ready output
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">
            Review, save, or send.
          </h2>
        </div>
      </div>

      <div className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-box">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Labor
          </span>
          <strong className="mt-2 block font-mono text-2xl text-[var(--ink)]">
            {formatMoney(generated.breakdown.labor, input.currency)}
          </strong>
        </div>
        <div className="metric-box">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Materials
          </span>
          <strong className="mt-2 block font-mono text-2xl text-[var(--ink)]">
            {formatMoney(generated.breakdown.materials, input.currency)}
          </strong>
        </div>
        <div className="metric-box">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Deposit
          </span>
          <strong className="mt-2 block font-mono text-2xl text-[var(--ink)]">
            {formatMoney(generated.breakdown.depositAmount, input.currency)}
          </strong>
        </div>
        <div className="metric-box metric-box-total">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Total
          </span>
          <strong className="mt-2 block font-mono text-3xl text-[var(--accent-strong)] sm:text-4xl">
            {formatMoney(generated.breakdown.total, input.currency)}
          </strong>
        </div>
      </div>

      <div className="no-print mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Output type">
        {outputModes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={outputMode === mode.value ? "segment segment-active" : "segment"}
            onClick={() => setOutputMode(mode.value)}
            role="tab"
            aria-selected={outputMode === mode.value}
          >
            {mode.value === "email" ? <Mail className="h-4 w-4" aria-hidden="true" /> : null}
            {mode.label}
          </button>
        ))}
      </div>

      {hasBlankOutput ? (
        <div className="no-print mt-5 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--paper-soft)] p-6 text-center sm:p-8">
          <p className="mx-auto max-w-[42ch] text-sm font-bold leading-6 text-[var(--ink-soft)]">
            Your document appears here as you type. Start with the job basics, or load the example.
          </p>
        </div>
      ) : outputMode === "document" ? (
        <PrintableDocument input={input} generated={generated} />
      ) : (
        <div
          className="document-preview mt-5"
          tabIndex={0}
          aria-label={`Generated ${documentLabelLower} output`}
        >
          {selectedOutput}
        </div>
      )}

      <p className="no-print mt-3 text-xs font-medium leading-5 text-[var(--muted)]">
        ChangeOrderKit creates business templates and math checks, not legal advice. Review contract
        terms and local requirements before sending.
      </p>

      <div className={actionGridClass}>
        <button type="button" className="btn btn-secondary" onClick={copyDocument}>
          <Copy className="h-5 w-5" aria-hidden="true" />
          Copy
        </button>
        <button type="button" className="btn btn-secondary" onClick={downloadText}>
          <Download className="h-5 w-5" aria-hidden="true" />
          Download text
        </button>
        <button type="button" className="btn btn-primary" onClick={printDocument}>
          <Printer className="h-5 w-5" aria-hidden="true" />
          Print / PDF
        </button>
        {showKitUpsell ? (
          <a
            className="btn btn-secondary"
            href={kitHref}
            target="_blank"
            rel="noreferrer"
            onClick={handleKitClick}
          >
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
            Template kit
          </a>
        ) : null}
        {showPilotUpsell ? (
          <a
            className="btn btn-secondary"
            href={pilotHref}
            target="_blank"
            rel="noreferrer"
            onClick={handlePilotClick}
          >
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
            {pilotLabel}
          </a>
        ) : null}
      </div>

      <div aria-live="polite" className="no-print mt-3 min-h-6 text-sm font-bold text-[var(--accent-strong)]">
        {toast}
      </div>

      <div className="no-print mt-5 border-t border-[var(--border)] pt-5">
        <h3 className="flex items-center gap-2 text-base font-black text-[var(--ink)]">
          <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          Before sending
        </h3>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--ink-soft)]">
          {generated.checklist.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
