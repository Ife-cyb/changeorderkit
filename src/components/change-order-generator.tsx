"use client";

import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
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
type GuidedSectionId = "job" | "scope" | "price" | "approval";

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
  { value: "deposit-before", label: "Deposit before work begins" },
  { value: "completion", label: "Due when added work is complete" },
  { value: "next-invoice", label: "Add to next invoice" }
];

const currencies = [
  { value: "USD", label: "USD · US dollar" },
  { value: "CAD", label: "CAD · Canadian dollar" },
  { value: "GBP", label: "GBP · British pound" },
  { value: "AUD", label: "AUD · Australian dollar" },
  { value: "NGN", label: "NGN · Nigerian naira" }
] as const;

const guidedSections: Array<{
  id: GuidedSectionId;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "job",
    label: "Job",
    title: "Name the job",
    description: "Who is approving it, and what project is this for?"
  },
  {
    id: "scope",
    label: "Scope",
    title: "Describe the work",
    description: "Capture what the client expects in plain language."
  },
  {
    id: "price",
    label: "Price",
    title: "Price it once",
    description: "Enter the inputs you already use on the job."
  },
  {
    id: "approval",
    label: "Approval",
    title: "Set the handoff",
    description: "Choose what is due and when the client must respond."
  }
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

function titleForProject(documentType: DocumentType, project: string) {
  const trimmedProject = project.trim();
  return trimmedProject ? `${documentTypeLabel(documentType)} for ${trimmedProject}` : "";
}

function createBlankDraft(
  documentType: DocumentType,
  profile?: BusinessProfile | null
): ChangeOrderInput {
  const defaults = createDefaultInput(profile ?? undefined, documentType);

  return {
    ...defaults,
    documentTitle: "",
    provider: profile?.businessName?.trim() || "",
    businessEmail: profile?.contactEmail?.trim() || "",
    businessPhone: profile?.phone?.trim() || "",
    client: "",
    project: "",
    jobLocation: "",
    originalScope: "",
    newRequest: "",
    scheduleImpact: "",
    startDate: "",
    endDate: "",
    clientResponsibilities: "",
    exclusions: "",
    changePolicy: "",
    cancellationTerms: "",
    laborHours: 0,
    materialsCost: 0,
    rushPercent: 0
  };
}

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

function GuidedSectionHeader({
  number,
  title,
  description,
  ready,
  hasError,
  icon
}: {
  number: string;
  title: string;
  description: string;
  ready: boolean;
  hasError: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="guided-section-header">
      <div className="guided-section-heading">
        <span className="guided-section-number" aria-hidden="true">
          {number}
        </span>
        <span className="guided-section-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <span
        className={
          hasError
            ? "guided-section-state guided-section-state-error"
            : ready
              ? "guided-section-state guided-section-state-ready"
              : "guided-section-state"
        }
      >
        {hasError ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : ready ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : null}
        {hasError ? "Needs attention" : ready ? "Ready" : "In progress"}
      </span>
    </div>
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
  const [activeSection, setActiveSection] = useState<GuidedSectionId>("job");
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
  const sectionReadiness = useMemo<Record<GuidedSectionId, boolean>>(
    () => ({
      job: Boolean(input.provider.trim() && input.client.trim() && input.project.trim()),
      scope: Boolean(
        input.newRequest.trim() && (!isChangeOrder || input.originalScope.trim())
      ),
      price: generated.breakdown.total > 0,
      approval: Boolean(input.approvalDeadline && input.paymentTiming)
    }),
    [generated.breakdown.total, input, isChangeOrder]
  );
  const completedSections = Object.values(sectionReadiness).filter(Boolean).length;
  const completionPercent = completedSections * 25;
  const sectionErrors = useMemo<Record<GuidedSectionId, boolean>>(
    () => ({
      job: Boolean(
        errors.documentTitle || errors.provider || errors.businessEmail || errors.client || errors.project
      ),
      scope: Boolean(errors.originalScope || errors.newRequest),
      price: Boolean(
        errors.laborHours ||
          errors.hourlyRate ||
          errors.materialsCost ||
          errors.marginPercent ||
          errors.rushPercent
      ),
      approval: Boolean(errors.depositPercent)
    }),
    [errors]
  );
  const isExampleDraft =
    input.client === defaultInput.client &&
    input.project === defaultInput.project &&
    input.newRequest ===
      createDefaultInput(undefined, input.documentType).newRequest;

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

  function clearFieldError(field: keyof ChangeOrderInput) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function setTextField(field: keyof ChangeOrderInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  }

  function setProjectName(value: string) {
    setInput((current) => {
      const currentAutoTitle = titleForProject(current.documentType, current.project);
      const knownDefaultTitles = documentTypeOptions.map(
        (option) => createDefaultInput(undefined, option.value).documentTitle
      );
      const shouldUpdateTitle =
        !current.documentTitle.trim() ||
        current.documentTitle === currentAutoTitle ||
        knownDefaultTitles.includes(current.documentTitle);

      return {
        ...current,
        project: value,
        documentTitle: shouldUpdateTitle
          ? titleForProject(current.documentType, value)
          : current.documentTitle
      };
    });
    clearFieldError("project");
    clearFieldError("documentTitle");
  }

  function jumpToSection(sectionId: GuidedSectionId) {
    setActiveSection(sectionId);
    document.getElementById(`form-section-${sectionId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
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
    clearFieldError(field);
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
      window.setTimeout(() => {
        const firstError = firstErrorRef.current;
        firstError?.closest("details")?.setAttribute("open", "");
        firstError?.focus();
      }, 0);
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
    setActiveSection("job");
    showToast("Example draft restored.");
    trackEvent("draft_reset");
  }

  function startBlankDraft() {
    clearSavedDraft();
    setInput(createBlankDraft(input.documentType, businessProfile));
    setErrors({});
    setActiveSection("job");
    setOutputMode("document");
    showToast(`Blank ${documentLabelLower} ready.`);
    trackEvent("blank_draft_started", { document_type: input.documentType });
    window.setTimeout(() => {
      document.getElementById("project-name")?.focus();
    }, 0);
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
    <section className="tool-shell generator-shell py-6 sm:py-9" aria-label="Document generator">
      <div className="generator-intro mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.38fr)] lg:items-end">
        <div>
          <p className="panel-kicker mb-3">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Guided job desk
          </p>
          <h1 className="max-w-4xl text-3xl font-black leading-[0.98] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
            {activeCopy.hero}
          </h1>
          <p className="generator-dek mt-4 max-w-[65ch] text-base leading-7 text-[var(--ink-soft)] sm:text-lg sm:leading-8">
            {activeCopy.dek}
          </p>
          <div className="document-type-switcher mt-5" role="tablist" aria-label="Document type">
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
              {completedSections === guidedSections.length ? "Ready for review" : "Draft in progress"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:oklch(0.88_0.012_115)]">
              Replace the sample with the real job. The price and client document update as you type.
            </p>
          </div>
          <div className="ledger-progress" aria-label={`${completionPercent}% of guided sections ready`}>
            <span style={{ transform: `scaleX(${completionPercent / 100})` }} />
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Form readiness</span>
            <strong className="font-mono text-sm">{completedSections} / 4</strong>
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

      <div className="generator-workspace grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
        <form className="utility-panel guided-form no-print overflow-hidden" onSubmit={onGenerate} noValidate>
          <div className="guided-form-topbar">
            <div>
              <p className="panel-kicker">Your job, in order</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                Build the {documentLabelLower}
              </h2>
              <p className="guided-form-dek mt-1 text-sm leading-6 text-[var(--muted)]">
                Required decisions stay visible. Supporting detail opens only when you need it.
              </p>
            </div>
            <div className="guided-form-utilities" aria-label="Draft controls">
              <button type="button" className="form-text-action" onClick={startBlankDraft}>
                Start blank
              </button>
              <button type="button" className="form-text-action" onClick={resetDraft}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Use example
              </button>
              <span className="autosave-note" role="status">
                <span aria-hidden="true" />
                {draftLoaded ? "Autosaved locally" : "Loading draft"}
              </span>
            </div>
          </div>

          {isExampleDraft ? (
            <div className="example-handoff">
              <FileCheck2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <strong>See the finished result first.</strong>
                <span> This example is ready to review. Replace each detail with the real job, or start blank.</span>
              </div>
              <button type="button" onClick={startBlankDraft}>
                Start my job
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <nav className="form-progress" aria-label={`${documentLabel} form progress`}>
            <div className="form-progress-summary">
              <span>{completedSections} of 4 sections ready</span>
              <span>{completionPercent}%</span>
            </div>
            <div
              className="form-progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
              aria-label="Form completion"
            >
              <span style={{ transform: `scaleX(${completionPercent / 100})` }} />
            </div>
            <ol>
              {guidedSections.map((section, index) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={
                      activeSection === section.id
                        ? "form-progress-step form-progress-step-active"
                        : "form-progress-step"
                    }
                    onClick={() => jumpToSection(section.id)}
                    aria-current={activeSection === section.id ? "step" : undefined}
                  >
                    <span className="form-progress-index" aria-hidden="true">
                      {sectionErrors[section.id] ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : sectionReadiness[section.id] ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span>
                      <strong>{section.label}</strong>
                      <small>{section.title}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {hasErrors ? (
            <div className="form-error-summary" role="alert">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <strong>A few details still need you.</strong>
                <span> We moved focus to the first one. Fix it, then review the client document.</span>
              </div>
            </div>
          ) : null}

          <fieldset
            id="form-section-job"
            className="guided-form-section"
            onFocusCapture={() => setActiveSection("job")}
          >
            <legend className="sr-only">Job details</legend>
            <GuidedSectionHeader
              number="01"
              title="Name the job"
              description="Start with the same details you would say out loud to your team."
              ready={sectionReadiness.job}
              hasError={sectionErrors.job}
              icon={<BriefcaseBusiness className="h-5 w-5" />}
            />
            <div className="guided-fields grid gap-4 md:grid-cols-2">
              <label className="field-label md:col-span-2" htmlFor="project-name">
                Project or job name
                <input
                  id="project-name"
                  className="field-control field-control-emphasis"
                  value={input.project}
                  placeholder="Kitchen backsplash refresh"
                  aria-invalid={Boolean(errors.project)}
                  aria-describedby="project-help project-error"
                  ref={(node) => registerFirstError("project", node)}
                  onChange={(event) => setProjectName(event.target.value)}
                />
                <span id="project-help" className="field-help">
                  Use the name your client already recognizes.
                </span>
                <InputError id="project-error" message={errors.project} />
              </label>

              <label className="field-label">
                Client
                <input
                  className="field-control"
                  value={input.client}
                  placeholder="Mira Okonkwo"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.client)}
                  aria-describedby={errors.client ? "client-error" : undefined}
                  ref={(node) => registerFirstError("client", node)}
                  onChange={(event) => setTextField("client", event.target.value)}
                />
                <InputError id="client-error" message={errors.client} />
              </label>

              <label className="field-label">
                Your business
                <input
                  className="field-control"
                  value={input.provider}
                  placeholder="Greenline Remodeling"
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.provider)}
                  aria-describedby={errors.provider ? "provider-error" : undefined}
                  ref={(node) => registerFirstError("provider", node)}
                  onChange={(event) => setTextField("provider", event.target.value)}
                />
                <InputError id="provider-error" message={errors.provider} />
              </label>

              {!isChangeOrder ? (
                <label className="field-label md:col-span-2">
                  <span className="field-label-line">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Job location <small>Optional</small>
                  </span>
                  <input
                    className="field-control"
                    value={input.jobLocation}
                    placeholder="123 Maple Avenue"
                    autoComplete="street-address"
                    onChange={(event) => setTextField("jobLocation", event.target.value)}
                  />
                </label>
              ) : null}
            </div>

            <details className="optional-disclosure">
              <summary>
                <span>
                  Add document and contact details
                  <small>Title, email, phone, trade, and dates</small>
                </span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="optional-disclosure-body grid gap-4 md:grid-cols-2">
                <label className="field-label md:col-span-2">
                  Document title
                  <input
                    className="field-control"
                    value={input.documentTitle}
                    placeholder={titleForProject(input.documentType, input.project) || `${documentLabel} title`}
                    aria-invalid={Boolean(errors.documentTitle)}
                    aria-describedby={errors.documentTitle ? "documentTitle-error" : undefined}
                    ref={(node) => registerFirstError("documentTitle", node)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTextField("documentTitle", event.target.value)
                    }
                  />
                  <InputError id="documentTitle-error" message={errors.documentTitle} />
                </label>

                <label className="field-label">
                  Business email <small>Optional</small>
                  <input
                    className="field-control"
                    value={input.businessEmail}
                    type="email"
                    placeholder="hello@greenlineremodeling.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.businessEmail)}
                    aria-describedby={errors.businessEmail ? "businessEmail-error" : undefined}
                    ref={(node) => registerFirstError("businessEmail", node)}
                    onChange={(event) => setTextField("businessEmail", event.target.value)}
                  />
                  <InputError id="businessEmail-error" message={errors.businessEmail} />
                </label>

                <label className="field-label">
                  Business phone <small>Optional</small>
                  <input
                    className="field-control"
                    value={input.businessPhone}
                    placeholder="(312) 847-1928"
                    autoComplete="tel"
                    onChange={(event) => setTextField("businessPhone", event.target.value)}
                  />
                </label>

                <label className="field-label">
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

                {!isChangeOrder ? (
                  <>
                    <label className="field-label">
                      Start date <small>Optional</small>
                      <input
                        className="field-control"
                        type="date"
                        value={input.startDate}
                        onChange={(event) => setTextField("startDate", event.target.value)}
                      />
                    </label>
                    <label className="field-label">
                      Completion target <small>Optional</small>
                      <input
                        className="field-control"
                        type="date"
                        value={input.endDate}
                        onChange={(event) => setTextField("endDate", event.target.value)}
                      />
                    </label>
                  </>
                ) : null}
              </div>
            </details>
          </fieldset>

          <fieldset
            id="form-section-scope"
            className="guided-form-section"
            onFocusCapture={() => setActiveSection("scope")}
          >
            <legend className="sr-only">Scope details</legend>
            <GuidedSectionHeader
              number="02"
              title="Describe the work"
              description="Write it the way you would explain it to the client on site."
              ready={sectionReadiness.scope}
              hasError={sectionErrors.scope}
              icon={<FileCheck2 className="h-5 w-5" />}
            />
            <div className="guided-fields grid gap-4">
              <label className="field-label">
                {activeCopy.primaryScopeLabel}
                <textarea
                  className="field-control field-control-emphasis"
                  value={input.newRequest}
                  placeholder="Describe the exact work, finish, quantity, and area covered."
                  aria-invalid={Boolean(errors.newRequest)}
                  aria-describedby="newRequest-help newRequest-error"
                  ref={(node) => registerFirstError("newRequest", node)}
                  onChange={(event) => setTextField("newRequest", event.target.value)}
                />
                <span id="newRequest-help" className="field-help">
                  {activeCopy.primaryScopeHelp}
                </span>
                <InputError id="newRequest-error" message={errors.newRequest} />
              </label>

              {isChangeOrder ? (
                <label className="field-label">
                  Original agreed scope
                  <textarea
                    className="field-control"
                    value={input.originalScope}
                    placeholder="What was included before this request?"
                    aria-invalid={Boolean(errors.originalScope)}
                    aria-describedby="originalScope-help originalScope-error"
                    ref={(node) => registerFirstError("originalScope", node)}
                    onChange={(event) => setTextField("originalScope", event.target.value)}
                  />
                  <span id="originalScope-help" className="field-help">
                    This makes the boundary between approved and added work easy to see.
                  </span>
                  <InputError id="originalScope-error" message={errors.originalScope} />
                </label>
              ) : null}
            </div>

            <details className="optional-disclosure">
              <summary>
                <span>
                  Add schedule and safeguards
                  <small>Timing, exclusions, responsibilities, and policies</small>
                </span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="optional-disclosure-body grid gap-4">
                <label className="field-label">
                  {isChangeOrder ? "Schedule impact" : "Schedule notes"} <small>Optional</small>
                  <textarea
                    className="field-control"
                    value={input.scheduleImpact}
                    placeholder="Adds one workday after materials arrive."
                    onChange={(event) => setTextField("scheduleImpact", event.target.value)}
                  />
                </label>

                <label className="field-label">
                  Exclusions and scope boundary <small>Optional</small>
                  <textarea
                    className="field-control"
                    value={input.exclusions}
                    placeholder="List work, materials, permits, or hidden conditions that are not included."
                    onChange={(event) => setTextField("exclusions", event.target.value)}
                  />
                </label>

                {!isChangeOrder ? (
                  <label className="field-label">
                    Client responsibilities <small>Optional</small>
                    <textarea
                      className="field-control"
                      value={input.clientResponsibilities}
                      placeholder="Site access, final selections, approvals, or owner-supplied materials."
                      onChange={(event) => setTextField("clientResponsibilities", event.target.value)}
                    />
                  </label>
                ) : null}

                {isServiceAgreement ? (
                  <>
                    <label className="field-label">
                      Change policy
                      <textarea
                        className="field-control"
                        value={input.changePolicy}
                        onChange={(event) => setTextField("changePolicy", event.target.value)}
                      />
                    </label>
                    <label className="field-label">
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
            </details>
          </fieldset>

          <fieldset
            id="form-section-price"
            className="guided-form-section"
            onFocusCapture={() => setActiveSection("price")}
          >
            <legend className="sr-only">Pricing details</legend>
            <GuidedSectionHeader
              number="03"
              title="Price it once"
              description="The total recalculates immediately. No separate calculator needed."
              ready={sectionReadiness.price}
              hasError={sectionErrors.price}
              icon={<CircleDollarSign className="h-5 w-5" />}
            />
            <div className="guided-fields pricing-fields grid gap-4 md:grid-cols-2">
              <label className="field-label">
                Currency
                <select
                  className="field-control"
                  value={input.currency}
                  onChange={(event) => setTextField("currency", event.target.value)}
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                {isChangeOrder ? "Extra labor hours" : "Labor hours"}
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

              <label className="field-label">
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

              <label className="field-label">
                Materials and direct costs
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
            </div>

            <div className="pricing-live-strip" aria-live="polite">
              <div>
                <Calculator className="h-5 w-5" aria-hidden="true" />
                <span>
                  <small>Labor + costs + adjustments</small>
                  <strong>Client total</strong>
                </span>
              </div>
              <strong>{formatMoney(generated.breakdown.total, input.currency)}</strong>
            </div>

            <details className="optional-disclosure">
              <summary>
                <span>
                  Adjust margin or rush pricing
                  <small>Use only when the job calls for it</small>
                </span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="optional-disclosure-body grid gap-4 md:grid-cols-2">
                <label className="field-label">
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

                <label className="field-label">
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
              </div>
            </details>
          </fieldset>

          <fieldset
            id="form-section-approval"
            className="guided-form-section"
            onFocusCapture={() => setActiveSection("approval")}
          >
            <legend className="sr-only">Approval details</legend>
            <GuidedSectionHeader
              number="04"
              title="Set the handoff"
              description="Tell the client what is due now and when you need an answer."
              ready={sectionReadiness.approval}
              hasError={sectionErrors.approval}
              icon={<CalendarClock className="h-5 w-5" />}
            />
            <div className="guided-fields grid gap-4 md:grid-cols-2">
              <label className="field-label md:col-span-2">
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

              <label className="field-label">
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
                  aria-describedby="deposit-help depositPercent-error"
                  onChange={(event) => setNumberField("depositPercent", event.target.value)}
                />
                <span id="deposit-help" className="field-help">
                  {formatMoney(generated.breakdown.depositAmount, input.currency)} due before work
                </span>
                <InputError id="depositPercent-error" message={errors.depositPercent} />
              </label>

              <label className="field-label">
                Approval deadline
                <input
                  className="field-control"
                  type="date"
                  value={input.approvalDeadline}
                  onChange={(event) => setTextField("approvalDeadline", event.target.value)}
                />
              </label>

              <label className="field-label md:col-span-2">
                Client email tone
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
          </fieldset>

          <div className="guided-form-actions">
            <div>
              <strong>Your client document is already taking shape.</strong>
              <span>Review it, then come back to change any detail.</span>
            </div>
            <div className="guided-form-action-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={saveToAccount}
                disabled={isSaving}
              >
                <Save className="h-5 w-5" aria-hidden="true" />
                {isSaving ? "Saving draft" : currentOrderId ? "Save changes" : "Save draft"}
              </button>
              <button type="submit" className="btn btn-primary">
                Review {documentLabelLower}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>

        <section ref={outputRef} className="utility-panel output-workspace print-area p-4 sm:p-5 xl:sticky xl:top-24 xl:self-start">
          <div className="no-print mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="panel-kicker">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Live client view
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">
                This is what your client sees.
              </h2>
            </div>
            <div className="live-preview-status">
              <span aria-hidden="true" />
              Updates as you type
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
              <strong className="mt-2 block font-mono text-3xl text-[var(--accent-strong)]">
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

          <div className="output-actions no-print mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={copyDocument}>
              <Copy className="h-5 w-5" aria-hidden="true" />
              Copy client text
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
            ) : null}
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
            ) : null}
          </div>

          <div aria-live="polite" className="no-print mt-3 min-h-6 text-sm font-bold text-[var(--accent-strong)]">
            {toast}
          </div>

          <div className="document-legal-note no-print">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isServiceAgreement
                ? "Service agreement starter only. Have legal terms reviewed for your location, trade, and licensing rules."
                : "Business template only. Review your contract and local laws before using late fees, interest, liens, or legal escalation."}
            </span>
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
