"use client";

import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Printer,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ChangeOrderInput,
  createDefaultInput,
  defaultInput,
  formatMoney,
  generateChangeOrder,
  getPaymentState,
  sanitizeChangeOrderInput,
  validateChangeOrder,
  type Industry,
  type PaymentTiming,
  type Tone,
  type ValidationErrors
} from "@/lib/change-order";
import { trackEvent } from "@/lib/tracking";

type Props = {
  paymentLink?: string;
};

const storageKey = "changeorderkit:draft:v1";

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
    return parseSavedDraft(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function writeSavedDraft(input: ChangeOrderInput) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(input));
  } catch {
    // Browsers can block storage in private or restricted modes.
  }
}

function clearSavedDraft() {
  try {
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
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-red-700" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function ChangeOrderGenerator({ paymentLink }: Props) {
  const [input, setInput] = useState<ChangeOrderInput>(defaultInput);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(
    null
  );

  const generated = useMemo(() => generateChangeOrder(input), [input]);
  const paymentState = getPaymentState(paymentLink);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      setInput(readSavedDraft() ?? createDefaultInput());

      setDraftLoaded(true);
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, []);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }

    writeSavedDraft(input);
  }, [draftLoaded, input]);

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
    showToast("Change order generated.");
    trackEvent("change_order_generated", {
      industry: input.industry,
      total: Math.round(generated.breakdown.total)
    });
  }

  async function copyDocument() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before copying.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generated.fullDocument);
      showToast("Copied to clipboard.");
      trackEvent("change_order_copied", { industry: input.industry });
    } catch {
      showToast("Copy failed. Select the document text and copy manually.");
    }
  }

  function downloadText() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before downloading.");
      return;
    }

    const blob = new Blob([generated.fullDocument], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "change-order.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded text file.");
    trackEvent("change_order_downloaded", { industry: input.industry });
  }

  function printDocument() {
    if (!runValidation()) {
      showToast("Fix the highlighted fields before printing.");
      return;
    }

    trackEvent("change_order_printed", { industry: input.industry });
    window.print();
  }

  function resetDraft() {
    clearSavedDraft();
    setInput(createDefaultInput());
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

  return (
    <section className="tool-shell py-8 sm:py-10" aria-label="Change order generator">
      <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.45fr)] lg:items-end">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-bold text-teal-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Change order and payment protection
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Turn client changes into approved, paid work before you start.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Price the extra request, write the approval email, and keep a cleaner project
            record in under five minutes.
          </p>
        </div>
        <div className="utility-panel no-print p-4">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            This draft autosaves
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Your entries stay in this browser only. No account, database, or payment setup is
            required to use the free generator.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <form className="utility-panel no-print p-4 sm:p-5" onSubmit={onGenerate} noValidate>
          {hasErrors ? (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              Review the highlighted fields. The document is easier to defend when the scope
              details are complete.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Your business
              <input
                className="field-control"
                value={input.provider}
                autoComplete="organization"
                aria-invalid={Boolean(errors.provider)}
                aria-describedby={errors.provider ? "provider-error" : undefined}
                ref={(node) => registerFirstError("provider", node)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setTextField("provider", event.target.value)
                }
              />
              <InputError id="provider-error" message={errors.provider} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Project
              <input
                className="field-control"
                value={input.project}
                onChange={(event) => setTextField("project", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Original agreed scope
              <textarea
                className="field-control"
                value={input.originalScope}
                aria-invalid={Boolean(errors.originalScope)}
                aria-describedby="originalScope-help originalScope-error"
                ref={(node) => registerFirstError("originalScope", node)}
                onChange={(event) => setTextField("originalScope", event.target.value)}
              />
              <span id="originalScope-help" className="text-sm font-medium text-slate-500">
                Keep this factual. What was already included before the new request?
              </span>
              <InputError id="originalScope-error" message={errors.originalScope} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-800">
              New client request
              <textarea
                className="field-control"
                value={input.newRequest}
                aria-invalid={Boolean(errors.newRequest)}
                aria-describedby="newRequest-help newRequest-error"
                ref={(node) => registerFirstError("newRequest", node)}
                onChange={(event) => setTextField("newRequest", event.target.value)}
              />
              <span id="newRequest-help" className="text-sm font-medium text-slate-500">
                Paste the client&apos;s text or summarize the added work clearly.
              </span>
              <InputError id="newRequest-error" message={errors.newRequest} />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Approval deadline
              <input
                className="field-control"
                type="date"
                value={input.approvalDeadline}
                onChange={(event) => setTextField("approvalDeadline", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-800">
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

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="btn btn-primary">
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Generate change order
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetDraft}>
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Load example
            </button>
          </div>
        </form>

        <section ref={outputRef} className="utility-panel print-area p-4 sm:p-5">
          <div className="no-print mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-teal-800">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Ready-to-send output
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Review, copy, download, or print.
              </h2>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
              Business template only. Review your contract and local laws before using late
              fees, interest, liens, or legal escalation.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="metric-box">
              <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Labor
              </span>
              <strong className="mt-2 block font-mono text-2xl text-slate-950">
                {formatMoney(generated.breakdown.labor, input.currency)}
              </strong>
            </div>
            <div className="metric-box">
              <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Materials
              </span>
              <strong className="mt-2 block font-mono text-2xl text-slate-950">
                {formatMoney(generated.breakdown.materials, input.currency)}
              </strong>
            </div>
            <div className="metric-box">
              <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Deposit
              </span>
              <strong className="mt-2 block font-mono text-2xl text-slate-950">
                {formatMoney(generated.breakdown.depositAmount, input.currency)}
              </strong>
            </div>
            <div className="metric-box">
              <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Total
              </span>
              <strong className="mt-2 block font-mono text-2xl text-slate-950">
                {formatMoney(generated.breakdown.total, input.currency)}
              </strong>
            </div>
          </div>

          <div
            className="document-preview mt-5"
            tabIndex={0}
            aria-label="Generated change order document"
          >
            {generated.fullDocument}
          </div>

          <div className="no-print mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <div aria-live="polite" className="no-print mt-3 min-h-6 text-sm font-bold text-teal-800">
            {toast}
          </div>

          <div className="no-print mt-5 border-t border-slate-200 pt-5">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
              <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
              Before sending
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
              {generated.checklist.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
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
