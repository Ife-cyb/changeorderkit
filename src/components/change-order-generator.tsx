"use client";

import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveChangeOrderAction } from "@/app/actions/change-orders";
import {
  type BusinessProfile,
  type ChangeOrderInput,
  type DocumentType,
  type GeneratedChangeOrder,
  documentTypeLabel,
  documentTypeOptions,
  createDefaultInput,
  defaultInput,
  formatDate,
  formatMoney,
  generateChangeOrder,
  getPaymentState,
  getTemplateKitState,
  sanitizeChangeOrderInput,
  validateChangeOrder,
  type Industry,
  type PaymentTiming,
  type Tone,
  type ValidationErrors
} from "@/lib/change-order";
import { trackEvent } from "@/lib/tracking";

type OutputMode = "document" | "email" | "invoice" | "follow-up";

type Props = {
  paymentLink?: string;
  templateKitLink?: string;
  initialInput?: ChangeOrderInput;
  savedOrderId?: string;
  isSignedIn?: boolean;
  businessProfile?: BusinessProfile | null;
  useLocalDraft?: boolean;
};

const storageKey = "changeorderkit:draft:v2";
const documentStorageKey = "changeorderkit:draft:v3";

const industries: Array<{ value: Industry; label: string }> = [
  { value: "remodeling", label: "Remodeling" },
  { value: "landscaping", label: "Landscaping" },
  { value: "handyman", label: "Handyman" },
  { value: "web-design", label: "Web design" },
  { value: "creative", label: "Creative services" },
  { value: "consulting", label: "Consulting" }
];

const tones: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" }
];

const paymentTimings: Array<{ value: PaymentTiming; label: string }> = [
  { value: "deposit-before", label: "Deposit before added work begins" },
  { value: "completion", label: "Due when added work is complete" },
  { value: "next-invoice", label: "Add to next invoice" }
];

const outputModes: Array<{ value: OutputMode; label: string }> = [
  { value: "document", label: "Document" },
  { value: "email", label: "Email" },
  { value: "invoice", label: "Invoice note" },
  { value: "follow-up", label: "Follow-up" }
];

const documentCopy: Record<
  DocumentType,
  {
    hero: string;
    dek: string;
    scopeKicker: string;
    primaryScopeLabel: string;
    primaryScopeHelp: string;
    generatedToast: string;
  }
> = {
  "change-order": {
    hero: "Turn client changes into approved, paid work before you start.",
    dek:
      "Price the extra request, write the approval email, and produce a client-ready change order with terms, scope boundaries, and signature language.",
    scopeKicker: "Scope boundary",
    primaryScopeLabel: "New client request",
    primaryScopeHelp: "Paste the client's text or summarize the added work clearly.",
    generatedToast: "Change order generated."
  },
  "work-order": {
    hero: "Create clear work orders before the job hits the schedule.",
    dek:
      "Document the scope, job location, client responsibilities, schedule, pricing, and approval block in one client-ready work order.",
    scopeKicker: "Work scope",
    primaryScopeLabel: "Scope of work",
    primaryScopeHelp: "Describe the work the client is approving for this job.",
    generatedToast: "Work order generated."
  },
  "service-agreement": {
    hero: "Draft practical service agreements without turning the app into a law office.",
    dek:
      "Create an agreement starter with scope, payment terms, change policy, cancellation language, exclusions, and a clear review disclaimer.",
    scopeKicker: "Agreement scope",
    primaryScopeLabel: "Service scope",
    primaryScopeHelp: "Describe the services, deliverables, or job scope covered by this agreement starter.",
    generatedToast: "Service agreement generated."
  }
};

function parseSavedDraft(value: string | null): ChangeOrderInput | null {
  if (!value) {
    return null;
  }

  try {
    return sanitizeChangeOrderInput(JSON.parse(value));
  } catch {
    return null;
  }
}

function readSavedDraft(): ChangeOrderInput | null {
  try {
    return parseSavedDraft(
      window.localStorage.getItem(documentStorageKey) ?? window.localStorage.getItem(storageKey)
    );
  } catch {
    return null;
  }
}

function writeSavedDraft(input: ChangeOrderInput) {
  try {
    window.localStorage.setItem(documentStorageKey, JSON.stringify(input));
  } catch {
    // Browsers can block storage in private or restricted modes.
  }
}

function clearSavedDraft() {
  try {
    window.localStorage.removeItem(documentStorageKey);
    window.localStorage.removeItem(storageKey);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

function InputError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-[var(--danger)]" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function outputText(generated: GeneratedChangeOrder, mode: OutputMode) {
  if (mode === "email") {
    return generated.clientEmail;
  }

  if (mode === "invoice") {
    return generated.invoiceNote;
  }

  if (mode === "follow-up") {
    return generated.followUpTemplate;
  }

  return generated.primaryDocument;
}

function documentSlug(documentType: DocumentType) {
  return documentType;
}

function outputFilename(mode: OutputMode, documentType: DocumentType) {
  const slug = documentSlug(documentType);
  const names: Record<OutputMode, string> = {
    document: `${slug}-document.txt`,
    email: `${slug}-email.txt`,
    invoice: `${slug}-invoice-note.txt`,
    "follow-up": `${slug}-follow-up.txt`
  };

  return names[mode];
}

function PrintableDocument({
  input,
  generated
}: {
  input: ChangeOrderInput;
  generated: GeneratedChangeOrder;
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
          <strong>{input.provider || "Your business"}</strong>
          <span>{input.businessEmail || "Email not provided"}</span>
          <span>{input.businessPhone || "Phone not provided"}</span>
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

      <section>
        <h3>{isChangeOrder ? "Schedule impact" : "Schedule"}</h3>
        <p>
          {input.scheduleImpact ||
            (input.startDate || input.endDate
              ? `${input.startDate || "Start TBD"} to ${input.endDate || "completion TBD"}`
              : "Schedule will be confirmed after approval.")}
        </p>
      </section>

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
              <th scope="row">Margin/overhead</th>
              <td>{formatMoney(generated.breakdown.marginAmount, input.currency)}</td>
            </tr>
            <tr>
              <th scope="row">Rush/disruption</th>
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
            <tr className="total-row">
              <th scope="row">Total</th>
              <td>{formatMoney(generated.breakdown.total, input.currency)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {isServiceAgreement ? (
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
    </div>
  );
}

export function ChangeOrderGenerator({
  paymentLink,
  templateKitLink,
  initialInput,
  savedOrderId,
  isSignedIn = false,
  businessProfile,
  useLocalDraft = true
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState<ChangeOrderInput>(() =>
    sanitizeChangeOrderInput(initialInput ?? defaultInput)
  );
  const [currentOrderId, setCurrentOrderId] = useState(savedOrderId ?? "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>("document");
  const [isSaving, startSaving] = useTransition();
  const outputRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(
    null
  );

  const generated = useMemo(() => generateChangeOrder(input), [input]);
  const paymentState = getPaymentState(paymentLink);
  const kitState = getTemplateKitState(templateKitLink);
  const hasErrors = Object.keys(errors).length > 0;
  const selectedOutput = outputText(generated, outputMode);
  const activeCopy = documentCopy[input.documentType];
  const documentLabel = documentTypeLabel(input.documentType);
  const documentLabelLower = documentLabel.toLowerCase();
  const isChangeOrder = input.documentType === "change-order";
  const isServiceAgreement = input.documentType === "service-agreement";

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      const fallback = createDefaultInput(businessProfile ?? undefined);
      const restored = useLocalDraft ? readSavedDraft() : null;
      setInput(restored ?? sanitizeChangeOrderInput(initialInput ?? fallback));
      setDraftLoaded(true);
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [businessProfile, initialInput, useLocalDraft]);

  useEffect(() => {
    if (!draftLoaded || !useLocalDraft) {
      return;
    }

    writeSavedDraft(input);
  }, [draftLoaded, input, useLocalDraft]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 3500);
  }

  function setTextField(field: keyof ChangeOrderInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function setDocumentType(value: DocumentType) {
    setInput((current) => {
      const nextDefault = createDefaultInput(businessProfile ?? undefined, value);
      const defaults = documentTypeOptions.map((option) => createDefaultInput(undefined, option.value));
      const shouldReplace = (field: keyof ChangeOrderInput) =>
        typeof current[field] === "string" &&
        (!String(current[field]).trim() ||
          defaults.some((defaultValue) => defaultValue[field] === current[field]));

      return {
        ...current,
        documentType: value,
        documentTitle: shouldReplace("documentTitle") ? nextDefault.documentTitle : current.documentTitle,
        originalScope: shouldReplace("originalScope") ? nextDefault.originalScope : current.originalScope,
        newRequest: shouldReplace("newRequest") ? nextDefault.newRequest : current.newRequest,
        scheduleImpact: shouldReplace("scheduleImpact")
          ? nextDefault.scheduleImpact
          : current.scheduleImpact,
        startDate: current.startDate || nextDefault.startDate,
        endDate: current.endDate || nextDefault.endDate,
        clientResponsibilities: shouldReplace("clientResponsibilities")
          ? nextDefault.clientResponsibilities
          : current.clientResponsibilities,
        exclusions: shouldReplace("exclusions") ? nextDefault.exclusions : current.exclusions,
        changePolicy: shouldReplace("changePolicy") ? nextDefault.changePolicy : current.changePolicy,
        cancellationTerms: shouldReplace("cancellationTerms")
          ? nextDefault.cancellationTerms
          : current.cancellationTerms
      };
    });
    setErrors({});
  }

  function setNumberField(field: keyof ChangeOrderInput, value: string) {
    const parsed = Number.parseFloat(value);
    setInput((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
  }

  function registerFirstError(
    field: keyof ChangeOrderInput,
    node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  ) {
    if (errors[field] && !firstErrorRef.current && node) {
      firstErrorRef.current = node;
    }
  }

  function runValidation() {
    firstErrorRef.current = null;
    const nextErrors = validateChangeOrder(input);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => firstErrorRef.current?.focus(), 0);
      return false;
    }

    return true;
  }

  function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runValidation()) {
      showToast("Fix the highlighted fields before sending.");
      trackEvent("validation_failed", { fields: Object.keys(validateChangeOrder(input)).join(",") });
      return;
    }

    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(activeCopy.generatedToast);
    trackEvent("document_generated", {
      document_type: input.documentType,
      industry: input.industry,
      total: Math.round(generated.breakdown.total)
    });
  }

  function saveToAccount() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before saving.");
      return;
    }

    if (!isSignedIn) {
      router.push(`/sign-in?next=${encodeURIComponent("/")}`);
      return;
    }

    startSaving(async () => {
      const result = await saveChangeOrderAction(input, currentOrderId || null);

      if (!result.ok) {
        showToast(result.error);
        return;
      }

      if (result.id) {
        setCurrentOrderId(result.id);

        if (window.location.pathname.endsWith("/new")) {
          router.replace(`/dashboard/documents/${result.id}`);
        }
      }

      showToast(`${documentLabel} saved.`);
      trackEvent("document_saved", { document_type: input.documentType, industry: input.industry });
    });
  }

  async function copyDocument() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before copying.");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedOutput);
      showToast("Copied to clipboard.");
      trackEvent("document_copied", {
        document_type: input.documentType,
        industry: input.industry,
        output: outputMode
      });
    } catch {
      showToast("Copy failed. Select the document text and copy manually.");
    }
  }

  function downloadText() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before downloading.");
      return;
    }

    const blob = new Blob([selectedOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = outputFilename(outputMode, input.documentType);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded text file.");
    trackEvent("document_downloaded", {
      document_type: input.documentType,
      industry: input.industry,
      output: outputMode
    });
  }

  function printDocument() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before printing.");
      return;
    }

    setOutputMode("document");
    trackEvent("document_printed", { document_type: input.documentType, industry: input.industry });
    window.setTimeout(() => window.print(), 0);
  }

  function resetDraft() {
    clearSavedDraft();
    setInput(createDefaultInput(businessProfile ?? undefined, input.documentType));
    setErrors({});
    showToast("Example draft restored.");
    trackEvent("draft_reset");
  }

  function handlePaymentClick() {
    if (!paymentState.configured) {
      showToast("Payment link not configured yet.");
      trackEvent("payment_link_missing");
      return;
    }

    trackEvent("payment_cta_clicked");
  }

  function handleKitClick() {
    if (!kitState.configured) {
      showToast("Template kit link not configured yet.");
      trackEvent("template_kit_link_missing");
      return;
    }

    trackEvent("template_kit_cta_clicked");
  }

  return (
    <section className="tool-shell py-7 sm:py-10" aria-label="Document generator">
      <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-end">
        <div>
          <p className="panel-kicker mb-3">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Document generator
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-7xl">
            {activeCopy.hero}
          </h1>
          <p className="mt-5 max-w-[65ch] text-lg leading-8 text-[var(--ink-soft)]">
            {activeCopy.dek}
          </p>
          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Document type">
            {documentTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={input.documentType === option.value ? "segment segment-active" : "segment"}
                onClick={() => setDocumentType(option.value)}
                role="tab"
                aria-selected={input.documentType === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <aside className="ledger-rail no-print overflow-hidden" aria-label="Current draft status">
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:oklch(0.77_0.04_155)]">
              {isSignedIn ? "Workspace enabled" : "Browser draft"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:oklch(0.88_0.012_115)]">
              {isSignedIn
                ? "Saved drafts and business defaults are active."
                : "Autosaves locally. Sign in when this becomes a job record."}
            </p>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Document type</span>
            <strong className="text-right text-sm">{documentLabel}</strong>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Current total</span>
            <strong className="font-mono text-sm">
              {formatMoney(generated.breakdown.total, input.currency)}
            </strong>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Deposit due</span>
            <strong className="font-mono text-sm">
              {formatMoney(generated.breakdown.depositAmount, input.currency)}
            </strong>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Approval by</span>
            <strong className="font-mono text-sm">{formatDate(input.approvalDeadline)}</strong>
          </div>
          <div className="border-t border-[color:oklch(0.48_0.02_145_/_0.42)] p-3">
            {isSignedIn ? (
              <Link className="btn btn-secondary w-full" href="/dashboard">
                <FileText className="h-5 w-5" aria-hidden="true" />
                Dashboard
              </Link>
            ) : (
              <Link className="btn btn-secondary w-full" href="/sign-in?next=/">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
                Sign in to save
              </Link>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)]">
        <form className="utility-panel no-print p-4 sm:p-5" onSubmit={onGenerate} noValidate>
          <div className="form-section-title mb-5">
            <div>
              <p className="panel-kicker">Scope intake</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                Build the {documentLabelLower}
              </h2>
            </div>
            <span className="hidden rounded-md border border-[var(--border)] bg-[var(--paper-soft)] px-3 py-2 font-mono text-sm font-bold text-[var(--ink-soft)] sm:inline-flex">
              Draft v3
            </span>
          </div>
          {hasErrors ? (
            <div className="mb-5 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-semibold text-[var(--danger)]">
              Review the highlighted fields. The document is easier to defend when the scope
              details are complete.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)] md:col-span-2">
              Document title
              <input
                className="field-control"
                value={input.documentTitle}
                aria-invalid={Boolean(errors.documentTitle)}
                aria-describedby={errors.documentTitle ? "documentTitle-error" : undefined}
                ref={(node) => registerFirstError("documentTitle", node)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setTextField("documentTitle", event.target.value)
                }
              />
              <InputError id="documentTitle-error" message={errors.documentTitle} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Your business
              <input
                className="field-control"
                value={input.provider}
                autoComplete="organization"
                aria-invalid={Boolean(errors.provider)}
                aria-describedby={errors.provider ? "provider-error" : undefined}
                ref={(node) => registerFirstError("provider", node)}
                onChange={(event) => setTextField("provider", event.target.value)}
              />
              <InputError id="provider-error" message={errors.provider} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Client
              <input
                className="field-control"
                value={input.client}
                autoComplete="name"
                aria-invalid={Boolean(errors.client)}
                aria-describedby={errors.client ? "client-error" : undefined}
                ref={(node) => registerFirstError("client", node)}
                onChange={(event) => setTextField("client", event.target.value)}
              />
              <InputError id="client-error" message={errors.client} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Business email
              <input
                className="field-control"
                value={input.businessEmail}
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.businessEmail)}
                aria-describedby={errors.businessEmail ? "businessEmail-error" : undefined}
                ref={(node) => registerFirstError("businessEmail", node)}
                onChange={(event) => setTextField("businessEmail", event.target.value)}
              />
              <InputError id="businessEmail-error" message={errors.businessEmail} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Business phone
              <input
                className="field-control"
                value={input.businessPhone}
                autoComplete="tel"
                onChange={(event) => setTextField("businessPhone", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Project
              <input
                className="field-control"
                value={input.project}
                onChange={(event) => setTextField("project", event.target.value)}
              />
            </label>

            {!isChangeOrder ? (
              <>
                <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                  Job location
                  <input
                    className="field-control"
                    value={input.jobLocation}
                    autoComplete="street-address"
                    onChange={(event) => setTextField("jobLocation", event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                  Start date
                  <input
                    className="field-control"
                    type="date"
                    value={input.startDate}
                    onChange={(event) => setTextField("startDate", event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                  Completion target
                  <input
                    className="field-control"
                    type="date"
                    value={input.endDate}
                    onChange={(event) => setTextField("endDate", event.target.value)}
                  />
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Industry
              <select
                className="field-control"
                value={input.industry}
                onChange={(event) => setTextField("industry", event.target.value as Industry)}
              >
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <p className="panel-kicker mb-4">{activeCopy.scopeKicker}</p>
            <div className="grid gap-4">
            {isChangeOrder ? (
              <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                Original agreed scope
                <textarea
                  className="field-control"
                  value={input.originalScope}
                  aria-invalid={Boolean(errors.originalScope)}
                  aria-describedby="originalScope-help originalScope-error"
                  ref={(node) => registerFirstError("originalScope", node)}
                  onChange={(event) => setTextField("originalScope", event.target.value)}
                />
                <span id="originalScope-help" className="text-sm font-medium text-[var(--muted)]">
                  What was already included before the new request?
                </span>
                <InputError id="originalScope-error" message={errors.originalScope} />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              {activeCopy.primaryScopeLabel}
              <textarea
                className="field-control"
                value={input.newRequest}
                aria-invalid={Boolean(errors.newRequest)}
                aria-describedby="newRequest-help newRequest-error"
                ref={(node) => registerFirstError("newRequest", node)}
                onChange={(event) => setTextField("newRequest", event.target.value)}
              />
              <span id="newRequest-help" className="text-sm font-medium text-[var(--muted)]">
                {activeCopy.primaryScopeHelp}
              </span>
              <InputError id="newRequest-error" message={errors.newRequest} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              {isChangeOrder ? "Schedule impact" : "Schedule notes"}
              <textarea
                className="field-control"
                value={input.scheduleImpact}
                onChange={(event) => setTextField("scheduleImpact", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Exclusions and scope boundary
              <textarea
                className="field-control"
                value={input.exclusions}
                onChange={(event) => setTextField("exclusions", event.target.value)}
              />
            </label>
            {!isChangeOrder ? (
              <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                Client responsibilities
                <textarea
                  className="field-control"
                  value={input.clientResponsibilities}
                  onChange={(event) => setTextField("clientResponsibilities", event.target.value)}
                />
              </label>
            ) : null}
            {isServiceAgreement ? (
              <>
                <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                  Change policy
                  <textarea
                    className="field-control"
                    value={input.changePolicy}
                    onChange={(event) => setTextField("changePolicy", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
                  Cancellation language
                  <textarea
                    className="field-control"
                    value={input.cancellationTerms}
                    onChange={(event) => setTextField("cancellationTerms", event.target.value)}
                  />
                </label>
              </>
            ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <p className="panel-kicker mb-4">Pricing math</p>
            <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Extra labor hours
              <input
                className="field-control"
                type="number"
                min="0"
                step="0.25"
                inputMode="decimal"
                value={input.laborHours}
                aria-invalid={Boolean(errors.laborHours)}
                aria-describedby={errors.laborHours ? "laborHours-error" : undefined}
                onChange={(event) => setNumberField("laborHours", event.target.value)}
              />
              <InputError id="laborHours-error" message={errors.laborHours} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Hourly rate
              <input
                className="field-control"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={input.hourlyRate}
                aria-invalid={Boolean(errors.hourlyRate)}
                aria-describedby={errors.hourlyRate ? "hourlyRate-error" : undefined}
                onChange={(event) => setNumberField("hourlyRate", event.target.value)}
              />
              <InputError id="hourlyRate-error" message={errors.hourlyRate} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Materials cost
              <input
                className="field-control"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={input.materialsCost}
                aria-invalid={Boolean(errors.materialsCost)}
                aria-describedby={errors.materialsCost ? "materialsCost-error" : undefined}
                onChange={(event) => setNumberField("materialsCost", event.target.value)}
              />
              <InputError id="materialsCost-error" message={errors.materialsCost} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Margin/overhead %
              <input
                className="field-control"
                type="number"
                min="0"
                max="80"
                step="1"
                inputMode="decimal"
                value={input.marginPercent}
                aria-invalid={Boolean(errors.marginPercent)}
                aria-describedby={errors.marginPercent ? "marginPercent-error" : undefined}
                onChange={(event) => setNumberField("marginPercent", event.target.value)}
              />
              <InputError id="marginPercent-error" message={errors.marginPercent} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Rush/disruption %
              <input
                className="field-control"
                type="number"
                min="0"
                max="100"
                step="1"
                inputMode="decimal"
                value={input.rushPercent}
                aria-invalid={Boolean(errors.rushPercent)}
                aria-describedby={errors.rushPercent ? "rushPercent-error" : undefined}
                onChange={(event) => setNumberField("rushPercent", event.target.value)}
              />
              <InputError id="rushPercent-error" message={errors.rushPercent} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Deposit %
              <input
                className="field-control"
                type="number"
                min="0"
                max="100"
                step="1"
                inputMode="decimal"
                value={input.depositPercent}
                aria-invalid={Boolean(errors.depositPercent)}
                aria-describedby={errors.depositPercent ? "depositPercent-error" : undefined}
                onChange={(event) => setNumberField("depositPercent", event.target.value)}
              />
              <InputError id="depositPercent-error" message={errors.depositPercent} />
            </label>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Payment timing
              <select
                className="field-control"
                value={input.paymentTiming}
                onChange={(event) =>
                  setTextField("paymentTiming", event.target.value as PaymentTiming)
                }
              >
                {paymentTimings.map((timing) => (
                  <option key={timing.value} value={timing.value}>
                    {timing.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Approval deadline
              <input
                className="field-control"
                type="date"
                value={input.approvalDeadline}
                onChange={(event) => setTextField("approvalDeadline", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Email tone
              <select
                className="field-control"
                value={input.tone}
                onChange={(event) => setTextField("tone", event.target.value as Tone)}
              >
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button type="submit" className="btn btn-primary">
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Generate
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={saveToAccount}
              disabled={isSaving}
            >
              <Save className="h-5 w-5" aria-hidden="true" />
              {isSaving ? "Saving" : currentOrderId ? "Save changes" : "Save"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetDraft}>
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Load example
            </button>
          </div>
        </form>

        <section ref={outputRef} className="utility-panel print-area p-4 sm:p-5 xl:sticky xl:top-24 xl:self-start">
          <div className="no-print mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="panel-kicker">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Client-ready output
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">
                Review, save, or send.
              </h2>
            </div>
            <div className="rounded-lg border border-[color:oklch(0.75_0.08_75)] bg-[var(--warning-soft)] p-3 text-sm font-semibold leading-6 text-[color:oklch(0.34_0.08_62)]">
              {isServiceAgreement
                ? "Service agreement starter only. Have legal terms reviewed for your location, trade, and licensing rules."
                : "Business template only. Review your contract and local laws before using late fees, interest, liens, or legal escalation."}
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
            <div className="metric-box">
              <span className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
                Total
              </span>
              <strong className="mt-2 block font-mono text-2xl text-[var(--ink)]">
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

          {outputMode === "document" ? (
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

          <div className="no-print mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button type="button" className="btn btn-primary" onClick={copyDocument}>
              <Copy className="h-5 w-5" aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadText}>
              <Download className="h-5 w-5" aria-hidden="true" />
              Download text
            </button>
            <button type="button" className="btn btn-secondary" onClick={printDocument}>
              <Printer className="h-5 w-5" aria-hidden="true" />
              Print / PDF
            </button>
            {kitState.configured ? (
              <a
                className="btn btn-secondary"
                href={kitState.href}
                target="_blank"
                rel="noreferrer"
                onClick={handleKitClick}
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                Template kit
              </a>
            ) : (
              <button type="button" className="btn btn-disabled" onClick={handleKitClick}>
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                Kit unavailable
              </button>
            )}
            {paymentState.configured ? (
              <a
                className="btn btn-secondary"
                href={paymentState.href}
                target="_blank"
                rel="noreferrer"
                onClick={handlePaymentClick}
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                {paymentState.label}
              </a>
            ) : (
              <button type="button" className="btn btn-disabled" onClick={handlePaymentClick}>
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                {paymentState.label}
              </button>
            )}
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
      </div>
    </section>
  );
}
