"use client";

import {
  Calculator,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveChangeOrderAction } from "@/app/actions/change-orders";
import { DraftSummaryCard } from "@/components/generator/draft-summary-card";
import { IntakeContactFields } from "@/components/generator/intake-contact-fields";
import {
  IntakePricingFields,
  type NumericField
} from "@/components/generator/intake-pricing-fields";
import { IntakeScopeFields } from "@/components/generator/intake-scope-fields";
import { IntakeTermsFields } from "@/components/generator/intake-terms-fields";
import {
  OutputPanel,
  type OutputMode,
  outputFilename,
  outputText
} from "@/components/generator/output-panel";
import {
  type BusinessProfile,
  type ChangeOrderInput,
  type DocumentType,
  deadlineUrgency,
  documentTypeLabel,
  documentTypeOptions,
  createBlankInput,
  createDefaultInput,
  generateChangeOrder,
  getPilotState,
  getTemplateKitState,
  isExampleInput,
  sanitizeChangeOrderInput,
  validateChangeOrder,
  type ValidationErrors
} from "@/lib/change-order";
import { funnelEvents, totalBucket } from "@/lib/funnel";
import { trackEvent } from "@/lib/tracking";

type Props = {
  pilotLink?: string;
  templateKitLink?: string;
  showUpsells?: boolean;
  initialInput?: ChangeOrderInput;
  savedOrderId?: string;
  isSignedIn?: boolean;
  businessProfile?: BusinessProfile | null;
  useLocalDraft?: boolean;
};

const storageKey = "changeorderkit:draft:v2";
const documentStorageKey = "changeorderkit:draft:v3";

type LocalDraftRecord = {
  input: ChangeOrderInput;
  savedAt: string | null;
};

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

function parseSavedDraft(value: string | null): LocalDraftRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (parsed && typeof parsed === "object" && "input" in parsed) {
      const record = parsed as { input: unknown; savedAt?: unknown };

      const savedAt = typeof record.savedAt === "string" ? record.savedAt : "";

      return {
        input: sanitizeChangeOrderInput(record.input),
        savedAt: Number.isFinite(Date.parse(savedAt)) ? savedAt : null
      };
    }

    return {
      input: sanitizeChangeOrderInput(parsed),
      savedAt: null
    };
  } catch {
    return null;
  }
}

function readSavedDraft(): LocalDraftRecord | null {
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
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(documentStorageKey, JSON.stringify({ input, savedAt }));
    return savedAt;
  } catch {
    // Browsers can block storage in private or restricted modes.
    return null;
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

function autosaveLabel(
  savedAt: string | null,
  now: number,
  useLocalDraft: boolean,
  autosaveAvailable: boolean
) {
  if (!useLocalDraft) {
    return "Account record";
  }

  if (!autosaveAvailable) {
    return "Autosave unavailable";
  }

  if (!savedAt) {
    return "Autosave ready";
  }

  const parsedSavedAt = Date.parse(savedAt);

  if (!Number.isFinite(parsedSavedAt)) {
    return "Autosave ready";
  }

  const elapsedMinutes = Math.max(0, Math.floor((now - parsedSavedAt) / 60_000));

  if (elapsedMinutes < 1) {
    return "Autosaved just now";
  }

  if (elapsedMinutes < 60) {
    return `Autosaved ${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Autosaved ${elapsedHours}h ago`;
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function printWithDocumentTitle(title: string) {
  const previousTitle = document.title;
  document.title = title;

  try {
    window.print();
  } finally {
    document.title = previousTitle;
  }
}

export function ChangeOrderGenerator({
  pilotLink,
  templateKitLink,
  showUpsells = false,
  initialInput,
  savedOrderId,
  isSignedIn = false,
  businessProfile,
  useLocalDraft = true
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState<ChangeOrderInput>(() =>
    sanitizeChangeOrderInput(initialInput ?? createDefaultInput(businessProfile ?? undefined))
  );
  const [currentOrderId, setCurrentOrderId] = useState(savedOrderId ?? "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState("");
  const [numericDrafts, setNumericDrafts] = useState<Partial<Record<NumericField, string>>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autosaveAvailable, setAutosaveAvailable] = useState(true);
  const [autosaveClock, setAutosaveClock] = useState(() => Date.now());
  const [outputMode, setOutputMode] = useState<OutputMode>("document");
  const [isSaving, startSaving] = useTransition();
  const intakeRef = useRef<HTMLFormElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const viewedTrackedRef = useRef(false);
  const startedTrackedRef = useRef(false);
  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(
    null
  );

  const generated = useMemo(() => generateChangeOrder(input), [input]);
  const pilotState = getPilotState(pilotLink);
  const kitState = getTemplateKitState(templateKitLink);
  const showKitUpsell = showUpsells && kitState.configured;
  const showPilotUpsell = showUpsells && pilotState.configured;
  const upsellCount = Number(showKitUpsell) + Number(showPilotUpsell);
  const actionGridClass =
    upsellCount === 2
      ? "no-print mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-5"
      : upsellCount === 1
        ? "no-print mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        : "no-print mt-5 grid gap-3 sm:grid-cols-3";
  const hasErrors = Object.keys(errors).length > 0;
  const selectedOutput = outputText(generated, outputMode);
  const activeCopy = documentCopy[input.documentType];
  const documentLabel = documentTypeLabel(input.documentType);
  const documentLabelLower = documentLabel.toLowerCase();
  const isChangeOrder = input.documentType === "change-order";
  const isServiceAgreement = input.documentType === "service-agreement";
  const hasBlankOutput = !input.provider.trim() && !input.client.trim() && !input.newRequest.trim();
  const approvalUrgency = deadlineUrgency(input.approvalDeadline);
  const exampleInput = isExampleInput(input);
  const approvalDeadlineClass =
    approvalUrgency === "overdue"
      ? "text-[var(--danger)]"
      : approvalUrgency === "soon"
        ? "text-[var(--warning)]"
        : "text-[var(--ink)]";

  useEffect(() => {
    if (!viewedTrackedRef.current) {
      trackEvent(funnelEvents.generatorViewed, { document_type: input.documentType });
      viewedTrackedRef.current = true;
    }
  }, [input.documentType]);

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      const fallback = createDefaultInput(businessProfile ?? undefined);
      const restored = useLocalDraft ? readSavedDraft() : null;
      setInput(restored?.input ?? sanitizeChangeOrderInput(initialInput ?? fallback));
      setNumericDrafts({});
      setLastSavedAt(restored?.savedAt ?? null);
      setDraftLoaded(true);
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [businessProfile, initialInput, useLocalDraft]);

  useEffect(() => {
    if (!draftLoaded || !useLocalDraft) {
      return;
    }

    const saveId = window.setTimeout(() => {
      const savedAt = writeSavedDraft(input);
      setAutosaveAvailable(Boolean(savedAt));

      if (savedAt) {
        setLastSavedAt(savedAt);
        setAutosaveClock(Date.now());
      }
    }, 400);

    return () => window.clearTimeout(saveId);
  }, [draftLoaded, input, useLocalDraft]);

  useEffect(() => {
    const clockId = window.setInterval(() => setAutosaveClock(Date.now()), 30_000);
    return () => window.clearInterval(clockId);
  }, []);

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

  function trackFormStarted() {
    if (!startedTrackedRef.current) {
      trackEvent(funnelEvents.formStarted, { document_type: input.documentType });
      startedTrackedRef.current = true;
    }
  }

  function startDocument() {
    trackFormStarted();
    intakeRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
    window.setTimeout(() => firstFieldRef.current?.focus({ preventScroll: true }), 300);
  }

  function setTextField(field: keyof ChangeOrderInput, value: string) {
    trackFormStarted();
    setInput((current) => ({ ...current, [field]: value }));
  }

  function setDocumentType(value: DocumentType) {
    trackFormStarted();
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

  function setNumberField(field: NumericField, value: string) {
    trackFormStarted();
    setNumericDrafts((current) => ({ ...current, [field]: value }));
    const parsed = Number.parseFloat(value);
    setInput((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
  }

  function numberFieldValue(field: NumericField) {
    return numericDrafts[field] ?? String(input[field]);
  }

  function normalizeNumberField(field: NumericField) {
    setNumericDrafts((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
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
      trackEvent(funnelEvents.validationFailed, {
        fields: Object.keys(validateChangeOrder(input)).join(",")
      });
      return;
    }

    if (window.matchMedia("(max-width: 1279px)").matches) {
      outputRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
    }
    showToast(activeCopy.generatedToast);
    trackEvent(funnelEvents.changeOrderGenerated, {
      document_type: input.documentType,
      industry: input.industry,
      currency: input.currency,
      total_bucket: totalBucket(generated.breakdown.total)
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
      trackEvent(funnelEvents.changeOrderCopied, {
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
    trackEvent(funnelEvents.changeOrderDownloaded, {
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
    trackEvent(funnelEvents.changeOrderPrinted, {
      document_type: input.documentType,
      industry: input.industry
    });
    window.setTimeout(
      () => printWithDocumentTitle(input.documentTitle.trim() || documentLabel),
      0
    );
  }

  function resetDraft() {
    clearSavedDraft();
    setInput(createDefaultInput(businessProfile ?? undefined, input.documentType));
    setNumericDrafts({});
    setErrors({});
    showToast("Example draft restored.");
    trackEvent(funnelEvents.draftReset);
  }

  function clearToBlank(eventName: "example_cleared" | "form_cleared", message: string) {
    clearSavedDraft();
    setInput(createBlankInput(businessProfile ?? undefined, input.documentType));
    setNumericDrafts({});
    setErrors({});
    setLastSavedAt(null);
    showToast(message);
    trackEvent(eventName, { document_type: input.documentType });
    window.setTimeout(() => firstFieldRef.current?.focus(), 0);
  }

  function handlePilotClick() {
    trackEvent(funnelEvents.pilotCtaClicked, { source: "generator" });
  }

  function handleKitClick() {
    trackEvent("template_kit_cta_clicked");
  }

  return (
    <section id="generator" className="tool-shell scroll-mt-6 py-5 sm:py-10" aria-label="Document generator">
      <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-end">
        <div>
          <p className="panel-kicker mb-3">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Document generator
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-7xl">
            {activeCopy.hero}
          </h1>
          <p className="mt-3 max-w-[65ch] text-lg leading-8 text-[var(--ink-soft)] sm:mt-5">
            {activeCopy.dek}
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={startDocument}>
            Start your {documentLabelLower}
          </button>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)] sm:mt-5">
            Document type
          </p>
          <div
            className="mt-2 grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Document type"
          >
            {documentTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={input.documentType === option.value ? "segment segment-active" : "segment"}
                onClick={() => setDocumentType(option.value)}
                role="radio"
                aria-checked={input.documentType === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <DraftSummaryCard
          isSignedIn={isSignedIn}
          documentLabel={documentLabel}
          exampleInput={exampleInput}
          total={generated.breakdown.total}
          deposit={generated.breakdown.depositAmount}
          currency={input.currency}
          approvalDeadline={input.approvalDeadline}
          approvalUrgency={approvalUrgency}
          approvalDeadlineClass={approvalDeadlineClass}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)] xl:items-start">
        <form
          ref={intakeRef}
          className="utility-panel no-print scroll-mt-6 p-4 sm:p-5"
          onSubmit={onGenerate}
          noValidate
        >
          <div className="form-section-title mb-5">
            <div>
              <p className="panel-kicker">Scope intake</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                Build the {documentLabelLower}
              </h2>
            </div>
            <span className="hidden rounded-md border border-[var(--border)] bg-[var(--paper-soft)] px-3 py-2 font-mono text-sm font-bold text-[var(--ink-soft)] sm:inline-flex">
              {autosaveLabel(lastSavedAt, autosaveClock, useLocalDraft, autosaveAvailable)}
            </span>
          </div>
          {exampleInput ? (
            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[var(--accent-strong)]">
                You&apos;re viewing an example job.
              </p>
              <button
                type="button"
                className="btn btn-primary shrink-0"
                onClick={() => clearToBlank(funnelEvents.exampleCleared, "Ready for your job details.")}
              >
                Use my own job
              </button>
            </div>
          ) : null}
          {hasErrors ? (
            <div className="mb-5 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-semibold text-[var(--danger)]">
              Review the highlighted fields. The document is easier to defend when the scope
              details are complete.
            </div>
          ) : null}

          <IntakeContactFields
            input={input}
            errors={errors}
            isChangeOrder={isChangeOrder}
            setTextField={setTextField}
            registerFirstError={registerFirstError}
            setFirstField={(node) => {
              firstFieldRef.current = node;
            }}
          />
          <IntakeScopeFields
            input={input}
            errors={errors}
            isChangeOrder={isChangeOrder}
            isServiceAgreement={isServiceAgreement}
            scopeKicker={activeCopy.scopeKicker}
            primaryScopeLabel={activeCopy.primaryScopeLabel}
            primaryScopeHelp={activeCopy.primaryScopeHelp}
            setTextField={setTextField}
            registerFirstError={registerFirstError}
          />
          <IntakePricingFields
            errors={errors}
            numberFieldValue={numberFieldValue}
            setNumberField={setNumberField}
            normalizeNumberField={normalizeNumberField}
          />
          <IntakeTermsFields input={input} setTextField={setTextField} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="submit" className="btn btn-primary">
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Check &amp; review
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => clearToBlank(funnelEvents.formCleared, "Form cleared.")}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Clear form
            </button>
          </div>
        </form>

        <OutputPanel
          outputRef={outputRef}
          input={input}
          generated={generated}
          outputMode={outputMode}
          setOutputMode={setOutputMode}
          hasBlankOutput={hasBlankOutput}
          selectedOutput={selectedOutput}
          documentLabelLower={documentLabelLower}
          actionGridClass={actionGridClass}
          copyDocument={copyDocument}
          downloadText={downloadText}
          printDocument={printDocument}
          showKitUpsell={showKitUpsell}
          kitHref={kitState.href}
          handleKitClick={handleKitClick}
          showPilotUpsell={showPilotUpsell}
          pilotHref={pilotState.href}
          pilotLabel={pilotState.label}
          handlePilotClick={handlePilotClick}
          toast={toast}
        />
      </div>
    </section>
  );
}
