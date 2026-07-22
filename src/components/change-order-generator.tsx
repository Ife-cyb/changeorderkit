"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveChangeOrderAction } from "@/app/actions/change-orders";
import type { AccountEntitlement } from "@/lib/account-entitlements";
import { DraftSummaryCard } from "@/components/generator/draft-summary-card";
import { useDeadlineUrgency } from "@/components/deadline-urgency";
import { GuidedSectionHeader } from "@/components/generator/guided-section-header";
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
import {
  DOCUMENT_NOT_FOUND,
  FREE_DOCUMENT_LIMIT_REACHED
} from "@/lib/change-order-service";
import {
  automaticDocumentTitle,
  saveCompletionState,
  transitionDocumentType
} from "@/lib/generator-state";
import { trackEvent } from "@/lib/tracking";

type GuidedSectionId = "job" | "scope" | "price" | "approval";

type Props = {
  pilotLink?: string;
  templateKitLink?: string;
  showUpsells?: boolean;
  initialInput?: ChangeOrderInput;
  savedOrderId?: string;
  isSignedIn?: boolean;
  businessProfile?: BusinessProfile | null;
  useLocalDraft?: boolean;
  headingLevel?: "h1" | "h2";
  cloudSaveBlockReason?: AccountEntitlement["cloudSaveBlockReason"];
  localDraftStorageKey?: string;
};

const storageKey = "changeorderkit:draft:v2";
const documentStorageKey = "changeorderkit:draft:v3";

type LocalDraftRecord = {
  input: ChangeOrderInput;
  savedAt: string | null;
  savedOrderId: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const guidedSections: Array<{
  id: GuidedSectionId;
  label: string;
  description: string;
}> = [
  { id: "job", label: "Job", description: "Who and where" },
  { id: "scope", label: "Scope", description: "What changes" },
  { id: "price", label: "Price", description: "What it costs" },
  { id: "approval", label: "Approval", description: "What happens next" }
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

function parseSavedDraft(value: string | null): LocalDraftRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (parsed && typeof parsed === "object" && "input" in parsed) {
      const record = parsed as {
        input: unknown;
        savedAt?: unknown;
        savedOrderId?: unknown;
      };

      const savedAt = typeof record.savedAt === "string" ? record.savedAt : "";

      return {
        input: sanitizeChangeOrderInput(record.input),
        savedAt: Number.isFinite(Date.parse(savedAt)) ? savedAt : null,
        savedOrderId:
          typeof record.savedOrderId === "string" && uuidPattern.test(record.savedOrderId)
            ? record.savedOrderId
            : null
      };
    }

    return {
      input: sanitizeChangeOrderInput(parsed),
      savedAt: null,
      savedOrderId: null
    };
  } catch {
    return null;
  }
}

function readSavedDraft(activeStorageKey: string): LocalDraftRecord | null {
  try {
    return parseSavedDraft(
      window.localStorage.getItem(activeStorageKey) ??
        (activeStorageKey === documentStorageKey ? window.localStorage.getItem(storageKey) : null)
    );
  } catch {
    return null;
  }
}

function writeSavedDraft(
  input: ChangeOrderInput,
  activeStorageKey: string,
  savedOrderId: string | null = null
) {
  try {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      activeStorageKey,
      JSON.stringify({ input, savedAt, savedOrderId })
    );
    return savedAt;
  } catch {
    // Browsers can block storage in private or restricted modes.
    return null;
  }
}

function preserveSavedOrderId(
  inputAtSave: ChangeOrderInput,
  activeStorageKey: string,
  savedOrderId: string
) {
  const existing = readSavedDraft(activeStorageKey);

  if (!existing) {
    return writeSavedDraft(inputAtSave, activeStorageKey, savedOrderId);
  }

  try {
    const savedAt = existing.savedAt ?? new Date().toISOString();
    window.localStorage.setItem(
      activeStorageKey,
      JSON.stringify({ ...existing, savedAt, savedOrderId })
    );
    return savedAt;
  } catch {
    return null;
  }
}

function removeSavedOrderId(
  inputAtSave: ChangeOrderInput,
  activeStorageKey: string
) {
  const existing = readSavedDraft(activeStorageKey);
  const savedAt = existing?.savedAt ?? new Date().toISOString();

  try {
    window.localStorage.setItem(
      activeStorageKey,
      JSON.stringify({
        input: existing?.input ?? inputAtSave,
        savedAt,
        savedOrderId: null
      })
    );
    return savedAt;
  } catch {
    return null;
  }
}

function clearSavedDraft(activeStorageKey: string) {
  try {
    window.localStorage.removeItem(activeStorageKey);

    if (activeStorageKey === documentStorageKey) {
      window.localStorage.removeItem(storageKey);
    }
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
  useLocalDraft = true,
  headingLevel = "h1",
  cloudSaveBlockReason = null,
  localDraftStorageKey = documentStorageKey
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
  const [activeSection, setActiveSection] = useState<GuidedSectionId>("job");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autosaveAvailable, setAutosaveAvailable] = useState(true);
  const [autosaveClock, setAutosaveClock] = useState(() => Date.now());
  const [outputMode, setOutputMode] = useState<OutputMode>("document");
  const [isSaving, startSaving] = useTransition();
  const [saveLimitReached, setSaveLimitReached] = useState(false);
  const intakeRef = useRef<HTMLFormElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const viewedTrackedRef = useRef(false);
  const startedTrackedRef = useRef(false);
  const editRevisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const hydratedInputRef = useRef(false);
  const hydratedOrderIdRef = useRef(savedOrderId ?? "");
  const suppressAccountDraftAutosaveRef = useRef(false);
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
  const cloudSaveBlocked =
    !currentOrderId && (cloudSaveBlockReason !== null || saveLimitReached);
  const showCloudSaveNotice = cloudSaveBlocked || saveLimitReached;
  const showFreeLimitMessage =
    saveLimitReached || cloudSaveBlockReason === "free_limit_reached";
  const isChangeOrder = input.documentType === "change-order";
  const isServiceAgreement = input.documentType === "service-agreement";
  const sectionReadiness = useMemo<Record<GuidedSectionId, boolean>>(
    () => ({
      job: Boolean(input.provider.trim() && input.client.trim() && input.project.trim()),
      scope: Boolean(input.newRequest.trim() && (!isChangeOrder || input.originalScope.trim())),
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
        errors.documentTitle ||
          errors.provider ||
          errors.businessEmail ||
          errors.client ||
          errors.project ||
          errors.endDate
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
  const hasBlankOutput = !input.provider.trim() && !input.client.trim() && !input.newRequest.trim();
  const approvalUrgency = useDeadlineUrgency(input.approvalDeadline);
  const exampleInput = isExampleInput(input);
  const approvalDeadlineClass =
    approvalUrgency === "overdue"
      ? "text-[var(--danger)]"
      : approvalUrgency === "soon"
        ? "text-[var(--warning)]"
        : "text-[var(--ink)]";
  const HeroHeading = headingLevel;

  useEffect(() => {
    if (!viewedTrackedRef.current) {
      trackEvent(funnelEvents.generatorViewed, { document_type: input.documentType });
      viewedTrackedRef.current = true;
    }
  }, [input.documentType]);

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      const nextOrderId = savedOrderId ?? "";
      const fallback = createDefaultInput(businessProfile ?? undefined);
      const restored = useLocalDraft ? readSavedDraft(localDraftStorageKey) : null;
      const effectiveOrderId = nextOrderId || restored?.savedOrderId || "";
      const orderChanged =
        hydratedInputRef.current && hydratedOrderIdRef.current !== effectiveOrderId;
      const hasUnsavedEdits = editRevisionRef.current !== savedRevisionRef.current;

      if (!orderChanged && hasUnsavedEdits) {
        setDraftLoaded(true);
        hydratedInputRef.current = true;
        hydratedOrderIdRef.current = effectiveOrderId;
        return;
      }

      if (orderChanged) {
        editRevisionRef.current = 0;
        savedRevisionRef.current = 0;
      }

      setCurrentOrderId(effectiveOrderId);
      setInput(restored?.input ?? sanitizeChangeOrderInput(initialInput ?? fallback));
      setNumericDrafts({});
      setLastSavedAt(restored?.savedAt ?? null);
      setDraftLoaded(true);
      hydratedInputRef.current = true;
      hydratedOrderIdRef.current = effectiveOrderId;
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [businessProfile, initialInput, localDraftStorageKey, savedOrderId, useLocalDraft]);

  useEffect(() => {
    if (!draftLoaded || !useLocalDraft) {
      return;
    }

    if (suppressAccountDraftAutosaveRef.current) {
      if (editRevisionRef.current === savedRevisionRef.current) {
        return;
      }

      suppressAccountDraftAutosaveRef.current = false;
    }

    const saveId = window.setTimeout(() => {
      const savedAt = writeSavedDraft(
        input,
        localDraftStorageKey,
        localDraftStorageKey === documentStorageKey ? null : currentOrderId || null
      );
      setAutosaveAvailable(Boolean(savedAt));

      if (savedAt) {
        setLastSavedAt(savedAt);
        setAutosaveClock(Date.now());
      }
    }, 400);

    return () => window.clearTimeout(saveId);
  }, [currentOrderId, draftLoaded, input, localDraftStorageKey, useLocalDraft]);

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
    trackFormStarted();
    editRevisionRef.current += 1;
    setInput((current) => ({ ...current, [field]: value }));
    clearFieldError(field);

    if (field === "paymentTiming" && value !== "deposit-before") {
      clearFieldError("depositPercent");
    }

    if (field === "startDate") {
      clearFieldError("endDate");
    }
  }

  function setProjectName(value: string) {
    trackFormStarted();
    editRevisionRef.current += 1;
    setInput((current) => {
      const currentAutoTitle = automaticDocumentTitle(current.documentType, current.project);
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
          ? automaticDocumentTitle(current.documentType, value)
          : current.documentTitle
      };
    });
    clearFieldError("project");
    clearFieldError("documentTitle");
  }

  function jumpToSection(sectionId: GuidedSectionId) {
    setActiveSection(sectionId);
    document.getElementById(`form-section-${sectionId}`)?.scrollIntoView({
      behavior: preferredScrollBehavior(),
      block: "start"
    });
  }

  function setDocumentType(value: DocumentType) {
    if (input.documentType === value) {
      return;
    }

    trackFormStarted();
    editRevisionRef.current += 1;
    setInput((current) => transitionDocumentType(current, value, businessProfile));
    setErrors({});
  }

  function setNumberField(field: NumericField, value: string) {
    trackFormStarted();
    editRevisionRef.current += 1;
    setNumericDrafts((current) => ({ ...current, [field]: value }));
    const parsed = Number.parseFloat(value);
    setInput((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
    clearFieldError(field);
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
      window.setTimeout(() => {
        const firstInvalidField =
          firstErrorRef.current ??
          intakeRef.current?.querySelector<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >('[aria-invalid="true"]');
        firstInvalidField?.focus();
      }, 0);
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

    const revisionAtSave = editRevisionRef.current;
    setSaveLimitReached(false);

    startSaving(async () => {
      try {
        const result = await saveChangeOrderAction(input, currentOrderId || null);

        if (!result.ok) {
          if (result.code === FREE_DOCUMENT_LIMIT_REACHED) {
            setSaveLimitReached(true);
            router.refresh();
          }

          if (result.code === DOCUMENT_NOT_FOUND && !savedOrderId && currentOrderId) {
            const savedAt = removeSavedOrderId(input, localDraftStorageKey);
            setCurrentOrderId("");
            hydratedOrderIdRef.current = "";
            setAutosaveAvailable(Boolean(savedAt));

            if (savedAt) {
              setLastSavedAt(savedAt);
              setAutosaveClock(Date.now());
            }

            router.refresh();
            showToast(
              "That cloud record no longer exists. Your browser draft is still here; choose Save draft again to create a new record."
            );
            return;
          }

          showToast(result.error);
          return;
        }

        setSaveLimitReached(false);

        savedRevisionRef.current = revisionAtSave;
        const { hasNewerEdits, shouldNavigateToSavedDocument } = saveCompletionState(
          revisionAtSave,
          editRevisionRef.current
        );

        if (
          !hasNewerEdits &&
          useLocalDraft &&
          localDraftStorageKey !== documentStorageKey
        ) {
          suppressAccountDraftAutosaveRef.current = true;
          clearSavedDraft(localDraftStorageKey);
          setLastSavedAt(null);
        }

        if (
          hasNewerEdits &&
          result.id &&
          useLocalDraft &&
          localDraftStorageKey !== documentStorageKey
        ) {
          suppressAccountDraftAutosaveRef.current = false;
          const savedAt = preserveSavedOrderId(
            input,
            localDraftStorageKey,
            result.id
          );
          setAutosaveAvailable(Boolean(savedAt));

          if (savedAt) {
            setLastSavedAt(savedAt);
            setAutosaveClock(Date.now());
          }
        }

        if (result.id) {
          setCurrentOrderId(result.id);

          if (
            window.location.pathname.endsWith("/new") &&
            shouldNavigateToSavedDocument
          ) {
            router.replace(`/dashboard/documents/${result.id}`);
          }
        }

        showToast(
          hasNewerEdits
            ? `${documentLabel} saved. Newer edits are still unsaved—save again.`
            : `${documentLabel} saved.`
        );
        trackEvent("document_saved", {
          document_type: input.documentType,
          industry: input.industry,
          newer_edits: hasNewerEdits
        });
      } catch {
        showToast("Save failed. Your edits are still here—check your connection and try again.");
      }
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
    suppressAccountDraftAutosaveRef.current = false;
    if (!savedOrderId) {
      setCurrentOrderId("");
      hydratedOrderIdRef.current = "";
    }
    if (useLocalDraft) {
      clearSavedDraft(localDraftStorageKey);
    }
    editRevisionRef.current += 1;
    setInput(createDefaultInput(businessProfile ?? undefined, input.documentType));
    setNumericDrafts({});
    setErrors({});
    setActiveSection("job");
    showToast("Example draft restored.");
    trackEvent(funnelEvents.draftReset);
  }

  function clearToBlank(eventName: "example_cleared" | "form_cleared", message: string) {
    suppressAccountDraftAutosaveRef.current = false;
    if (!savedOrderId) {
      setCurrentOrderId("");
      hydratedOrderIdRef.current = "";
    }
    if (useLocalDraft) {
      clearSavedDraft(localDraftStorageKey);
    }
    editRevisionRef.current += 1;
    setInput(createBlankInput(businessProfile ?? undefined, input.documentType));
    setNumericDrafts({});
    setErrors({});
    setActiveSection("job");
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
    <section id="generator" className="tool-shell scroll-mt-24 py-5 sm:py-10" aria-label="Document generator">
      <div className="generator-intro no-print mb-4 grid gap-4 sm:mb-6 sm:gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-end">
        <div>
          <p className="panel-kicker mb-3">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Document generator
          </p>
          <HeroHeading className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-7xl">
            {activeCopy.hero}
          </HeroHeading>
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
          depositRequired={
            input.paymentTiming === "deposit-before" && generated.breakdown.depositAmount > 0
          }
          currency={input.currency}
          approvalDeadline={input.approvalDeadline}
          approvalUrgency={approvalUrgency}
          approvalDeadlineClass={approvalDeadlineClass}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)] xl:items-start">
        <form
          ref={intakeRef}
          className="utility-panel guided-form-shell no-print scroll-mt-6 overflow-hidden"
          onSubmit={onGenerate}
          noValidate
        >
          <div className="guided-form-topbar">
            <div>
              <p className="panel-kicker">Guided job intake</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                Build the {documentLabelLower}
              </h2>
              <p className="guided-form-dek mt-2 max-w-[52ch] text-sm leading-6 text-[var(--muted)]">
                Work through the job in the same order you would explain it to your client.
              </p>
            </div>
            <div className="guided-form-utilities">
              <span className="autosave-note">
                <span aria-hidden="true" />
                {autosaveLabel(lastSavedAt, autosaveClock, useLocalDraft, autosaveAvailable)}
              </span>
              <button type="button" className="form-text-action" onClick={resetDraft}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Example
              </button>
              <button
                type="button"
                className="form-text-action"
                onClick={() => clearToBlank(funnelEvents.formCleared, "Form cleared.")}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>
          {exampleInput ? (
            <div className="example-handoff">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <p>
                <strong>Example job loaded.</strong>{" "}
                <span>See the finished result, then replace it with your own details.</span>
              </p>
              <button
                type="button"
                onClick={() => clearToBlank(funnelEvents.exampleCleared, "Ready for your job details.")}
              >
                Use my own job
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {hasErrors ? (
            <div className="form-error-summary" role="alert">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <p>
                <strong>A few details need attention.</strong>{" "}
                <span>The first highlighted field is ready for you.</span>
              </p>
            </div>
          ) : null}

          <nav className="form-progress" aria-label="Form sections">
            <div className="form-progress-summary">
              <span>{completedSections} of 4 sections ready</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="form-progress-track" aria-hidden="true">
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
                    <span className="form-progress-index">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <fieldset
            id="form-section-job"
            className="guided-form-section"
            onFocusCapture={() => setActiveSection("job")}
          >
            <legend className="sr-only">Job and contact details</legend>
            <GuidedSectionHeader
              number="01"
              title="Name the job"
              description="Start with the people and project so the document feels real immediately."
              ready={sectionReadiness.job}
              hasError={sectionErrors.job}
              icon={BriefcaseBusiness}
            />
            <IntakeContactFields
              input={input}
              errors={errors}
              isChangeOrder={isChangeOrder}
              setTextField={setTextField}
              setProjectName={setProjectName}
              registerFirstError={registerFirstError}
              setFirstField={(node) => {
                firstFieldRef.current = node;
              }}
            />
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
              description="Capture the client request in plain language, then add safeguards only when needed."
              ready={sectionReadiness.scope}
              hasError={sectionErrors.scope}
              icon={ShieldCheck}
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
              description="Enter the numbers you already know. The client total updates as you type."
              ready={sectionReadiness.price}
              hasError={sectionErrors.price}
              icon={CircleDollarSign}
            />
            <IntakePricingFields
              input={input}
              total={generated.breakdown.total}
              isChangeOrder={isChangeOrder}
              errors={errors}
              setTextField={setTextField}
              numberFieldValue={numberFieldValue}
              setNumberField={setNumberField}
              normalizeNumberField={normalizeNumberField}
              registerFirstError={registerFirstError}
            />
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
              description="Tell the client what is due and when you need an answer."
              ready={sectionReadiness.approval}
              hasError={sectionErrors.approval}
              icon={CalendarClock}
            />
            <IntakeTermsFields
              input={input}
              depositAmount={generated.breakdown.depositAmount}
              errors={errors}
              setTextField={setTextField}
              numberFieldValue={numberFieldValue}
              setNumberField={setNumberField}
              normalizeNumberField={normalizeNumberField}
              registerFirstError={registerFirstError}
            />
          </fieldset>

          {showCloudSaveNotice ? (
            <div
              id="cloud-save-limit-notice"
              className="mx-4 mb-4 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-3 text-sm leading-6 text-[var(--ink-soft)] sm:mx-5"
              role="status"
            >
              <strong className="block font-black text-[var(--ink)]">
                {showFreeLimitMessage
                  ? "Free cloud-save limit reached."
                  : "Cloud-save usage is temporarily unavailable."}
              </strong>
              <span>
                {useLocalDraft && autosaveAvailable
                  ? "Your work remains in this generator and browser autosave continues. "
                  : "Your work remains in this editor while it is open. "}
                {showFreeLimitMessage
                  ? "Copy, download, and Print/PDF remain available. Delete saved documents until fewer than 3 remain to create another cloud save."
                  : "New cloud saves are blocked until account usage can be verified. Copy, download, and Print/PDF remain available."}
              </span>
            </div>
          ) : null}

          <div className="guided-form-actions">
            <div>
              <strong>Your client document is already taking shape.</strong>
              <span>Review it, then come back to change any detail.</span>
            </div>
            <div className="guided-form-action-buttons">
            <button
              type="button"
              className={cloudSaveBlocked ? "btn btn-disabled" : "btn btn-secondary"}
              onClick={saveToAccount}
              disabled={isSaving || cloudSaveBlocked}
              aria-describedby={showCloudSaveNotice ? "cloud-save-limit-notice" : undefined}
            >
              <Save className="h-5 w-5" aria-hidden="true" />
              {isSaving
                ? "Saving draft"
                : currentOrderId
                  ? "Save changes"
                  : cloudSaveBlocked
                    ? showFreeLimitMessage
                      ? "Cloud save limit reached"
                      : "Cloud save unavailable"
                    : "Save draft"}
            </button>
            <button type="submit" className="btn btn-primary">
              Review {documentLabelLower}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            </div>
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
