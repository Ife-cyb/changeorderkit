export type Tone = "friendly" | "direct" | "formal";

export type Industry =
  | "remodeling"
  | "landscaping"
  | "handyman"
  | "web-design"
  | "creative"
  | "consulting";

export type PaymentTiming = "deposit-before" | "completion" | "next-invoice";

export type DocumentType = "change-order" | "work-order" | "service-agreement";

export type ProjectDocumentStatus = "draft" | "ready" | "archived";
export type ChangeOrderStatus = ProjectDocumentStatus;
export type DeadlineUrgency = "overdue" | "soon" | "normal";

export type ProjectDocumentInput = {
  documentType: DocumentType;
  documentTitle: string;
  provider: string;
  businessEmail: string;
  businessPhone: string;
  client: string;
  project: string;
  jobLocation: string;
  originalScope: string;
  newRequest: string;
  scheduleImpact: string;
  startDate: string;
  endDate: string;
  clientResponsibilities: string;
  exclusions: string;
  changePolicy: string;
  cancellationTerms: string;
  laborHours: number;
  hourlyRate: number;
  materialsCost: number;
  marginPercent: number;
  rushPercent: number;
  depositPercent: number;
  approvalDeadline: string;
  paymentTiming: PaymentTiming;
  industry: Industry;
  tone: Tone;
  currency: string;
};

export type ChangeOrderInput = ProjectDocumentInput;

export type BusinessProfile = {
  id?: string;
  email?: string;
  businessName: string;
  contactEmail: string;
  phone: string;
  defaultHourlyRate: number;
  defaultMarginPercent: number;
  defaultDepositPercent: number;
  defaultPaymentTiming: PaymentTiming;
  defaultTone: Tone;
  createdAt?: string;
  updatedAt?: string;
};

export type SavedProjectDocument = {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  clientName: string;
  projectName: string;
  status: ProjectDocumentStatus;
  input: ProjectDocumentInput;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedChangeOrder = SavedProjectDocument;

export type PriceBreakdown = {
  labor: number;
  materials: number;
  subtotal: number;
  marginAmount: number;
  rushAmount: number;
  total: number;
  depositAmount: number;
  balanceAmount: number;
};

export type GeneratedProjectDocument = {
  breakdown: PriceBreakdown;
  documentType: DocumentType;
  documentTypeLabel: string;
  documentTitle: string;
  summary: string;
  email: string;
  clientEmail: string;
  approvalText: string;
  paymentTerms: string;
  invoiceNote: string;
  followUpTemplate: string;
  checklist: string[];
  primaryDocument: string;
  changeOrderDocument: string;
  fullDocument: string;
};

export type GeneratedChangeOrder = GeneratedProjectDocument;

export type ValidationErrors = Partial<Record<keyof ProjectDocumentInput, string>>;

export const documentTypeOptions: Array<{ value: DocumentType; label: string; shortLabel: string }> = [
  { value: "change-order", label: "Change order", shortLabel: "Change" },
  { value: "work-order", label: "Work order", shortLabel: "Work" },
  { value: "service-agreement", label: "Service agreement", shortLabel: "Agreement" }
];

const documentTypeValues = documentTypeOptions.map((option) => option.value) as readonly DocumentType[];

const industryValues: readonly Industry[] = [
  "remodeling",
  "landscaping",
  "handyman",
  "web-design",
  "creative",
  "consulting"
];

const paymentTimingValues: readonly PaymentTiming[] = [
  "deposit-before",
  "completion",
  "next-invoice"
];

const toneValues: readonly Tone[] = ["friendly", "direct", "formal"];

export const defaultInput: ProjectDocumentInput = {
  documentType: "change-order",
  documentTitle: "Change order for kitchen backsplash refresh",
  provider: "Greenline Remodeling",
  businessEmail: "hello@greenlineremodeling.com",
  businessPhone: "+1 (312) 847-1928",
  client: "Mira Okonkwo",
  project: "Kitchen backsplash refresh",
  jobLocation: "123 Maple Avenue",
  originalScope:
    "Install white subway tile backsplash in kitchen, including standard grout, trim, and cleanup.",
  newRequest:
    "Add tile behind the coffee bar and switch to a herringbone pattern around the range.",
  scheduleImpact: "Adds one workday after materials arrive.",
  startDate: "",
  endDate: "",
  clientResponsibilities:
    "Client will provide site access, final material selections, and timely approval before scheduling.",
  exclusions:
    "Electrical work, hidden wall repairs, permit fees, and owner-supplied material delays are excluded unless approved separately.",
  changePolicy:
    "Any work outside this approved scope must be documented and approved in writing before it is scheduled.",
  cancellationTerms:
    "If the client cancels after materials are ordered or labor is scheduled, completed work and non-refundable costs remain billable.",
  laborHours: 6,
  hourlyRate: 85,
  materialsCost: 220,
  marginPercent: 25,
  rushPercent: 0,
  depositPercent: 50,
  approvalDeadline: "",
  paymentTiming: "deposit-before",
  industry: "remodeling",
  tone: "friendly",
  currency: "USD"
};

export const defaultBusinessProfile: BusinessProfile = {
  businessName: "",
  contactEmail: "",
  phone: "",
  defaultHourlyRate: defaultInput.hourlyRate,
  defaultMarginPercent: defaultInput.marginPercent,
  defaultDepositPercent: defaultInput.depositPercent,
  defaultPaymentTiming: defaultInput.paymentTiming,
  defaultTone: defaultInput.tone
};

function documentDefaults(documentType: DocumentType): Partial<ProjectDocumentInput> {
  if (documentType === "work-order") {
    return {
      documentTitle: "Work order for kitchen backsplash refresh",
      originalScope: "",
      newRequest:
        "Install white subway tile backsplash in kitchen, including standard grout, trim, cleanup, and the approved coffee bar extension.",
      scheduleImpact: "Work is scheduled after approval, deposit, and material availability are confirmed.",
      clientResponsibilities:
        "Client will provide site access, clear the work area, confirm final material selections, and respond to scheduling questions promptly."
    };
  }

  if (documentType === "service-agreement") {
    return {
      documentTitle: "Service agreement for kitchen backsplash refresh",
      originalScope: "",
      newRequest:
        "Provide remodeling services for the kitchen backsplash refresh according to the scope, pricing, payment terms, and exclusions in this agreement starter.",
      scheduleImpact:
        "Work will be scheduled after agreement approval, deposit payment, material availability, and site readiness are confirmed.",
      clientResponsibilities:
        "Client will provide accurate project information, site access, timely decisions, and payment according to the approved schedule.",
      exclusions:
        "Hidden conditions, permit requirements, code upgrades, hazardous materials, owner-supplied material delays, and work not listed in the service scope are excluded unless approved separately.",
      changePolicy:
        "Requested changes, added work, substitutions, or schedule changes must be priced and approved in writing before they become part of the service scope.",
      cancellationTerms:
        "Either party may request cancellation in writing. Completed work, ordered materials, non-refundable costs, and scheduled labor already incurred remain billable."
    };
  }

  return {
    documentTitle: defaultInput.documentTitle,
    originalScope: defaultInput.originalScope,
    newRequest: defaultInput.newRequest,
    scheduleImpact: defaultInput.scheduleImpact,
    clientResponsibilities: defaultInput.clientResponsibilities,
    exclusions: defaultInput.exclusions,
    changePolicy: defaultInput.changePolicy,
    cancellationTerms: defaultInput.cancellationTerms
  };
}

export function documentTypeLabel(documentType: DocumentType) {
  return documentTypeOptions.find((option) => option.value === documentType)?.label ?? "Document";
}

export function businessInitials(provider?: string | null) {
  const words = provider?.match(/[\p{L}\p{N}]+/gu) ?? [];

  if (words.length === 0) {
    return "—";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("en-US");
}

function utcCalendarDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.floor(timestamp / 86_400_000);
}

export function deadlineUrgency(dateString: string, referenceDate: Date = new Date()): DeadlineUrgency {
  const targetDay = utcCalendarDay(dateString);

  if (targetDay === null || !Number.isFinite(referenceDate.getTime())) {
    return "normal";
  }

  const referenceDay = utcCalendarDay(referenceDate.toISOString().slice(0, 10));

  if (referenceDay === null) {
    return "normal";
  }

  const daysUntilDeadline = targetDay - referenceDay;

  if (daysUntilDeadline < 0) {
    return "overdue";
  }

  return daysUntilDeadline <= 3 ? "soon" : "normal";
}

export function sanitizeDocumentType(value: unknown, fallback: DocumentType = "change-order"): DocumentType {
  return isAllowedValue(value, documentTypeValues) ? value : fallback;
}

export function createDefaultInput(
  profile?: Partial<BusinessProfile>,
  documentType: DocumentType = "change-order"
): ProjectDocumentInput {
  const base = {
    ...defaultInput,
    ...documentDefaults(documentType),
    documentType,
    approvalDeadline: nextDate(3),
    startDate: nextDate(7),
    endDate: nextDate(10)
  };

  return profile ? applyBusinessProfileDefaults(base, profile) : base;
}

export function createBlankInput(
  profile?: Partial<BusinessProfile>,
  documentType: DocumentType = "change-order"
): ProjectDocumentInput {
  const base: ProjectDocumentInput = {
    ...defaultInput,
    documentType,
    documentTitle: "",
    provider: "",
    businessEmail: "",
    businessPhone: "",
    client: "",
    project: "",
    jobLocation: "",
    originalScope: "",
    newRequest: "",
    scheduleImpact: "",
    startDate: nextDate(7),
    endDate: nextDate(10),
    clientResponsibilities: "",
    exclusions: "",
    changePolicy: "",
    cancellationTerms: "",
    laborHours: 0,
    hourlyRate: 0,
    materialsCost: 0,
    approvalDeadline: nextDate(3)
  };

  return profile ? applyBusinessProfileDefaults(base, profile) : base;
}

export function isExampleInput(input: ProjectDocumentInput) {
  return documentTypeOptions.some((option) => {
    const example = createDefaultInput(undefined, option.value);

    return (Object.keys(example) as Array<keyof ProjectDocumentInput>).every(
      (field) => input[field] === example[field]
    );
  });
}

export function applyBusinessProfileDefaults(
  input: ProjectDocumentInput,
  profile: Partial<BusinessProfile>
): ProjectDocumentInput {
  return {
    ...input,
    provider: profile.businessName?.trim() || input.provider,
    businessEmail: profile.contactEmail?.trim() || input.businessEmail,
    businessPhone: profile.phone?.trim() || input.businessPhone,
    hourlyRate:
      typeof profile.defaultHourlyRate === "number"
        ? clampNumber(profile.defaultHourlyRate, 0, 100000)
        : input.hourlyRate,
    marginPercent:
      typeof profile.defaultMarginPercent === "number"
        ? clampNumber(profile.defaultMarginPercent, 0, 80)
        : input.marginPercent,
    depositPercent:
      typeof profile.defaultDepositPercent === "number"
        ? clampNumber(profile.defaultDepositPercent, 0, 100)
        : input.depositPercent,
    paymentTiming: isAllowedValue(profile.defaultPaymentTiming, paymentTimingValues)
      ? profile.defaultPaymentTiming
      : input.paymentTiming,
    tone: isAllowedValue(profile.defaultTone, toneValues) ? profile.defaultTone : input.tone
  };
}

export function nextDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function stringValue(value: unknown, fallback: string, maxLength = 5000) {
  const raw = typeof value === "string" ? value : fallback;
  return raw.replace(/\0/g, "").slice(0, maxLength);
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  return clampNumber(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

function dateValue(value: unknown, fallback: string) {
  if (value === "") {
    return "";
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  return Number.isNaN(new Date(`${value}T12:00:00`).getTime()) ? fallback : value;
}

function isAllowedValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function normalizeCurrency(value: unknown, fallback = "USD") {
  const candidate = typeof value === "string" ? value.trim().toUpperCase() : "";

  if (!candidate) {
    return fallback;
  }

  try {
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: candidate
    }).format(0);

    return candidate;
  } catch {
    return fallback;
  }
}

export function sanitizeChangeOrderInput(
  value: unknown,
  documentTypeOverride?: DocumentType
): ProjectDocumentInput {
  const saved =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<Record<keyof ProjectDocumentInput, unknown>>)
      : {};
  const fallback = createDefaultInput(undefined, documentTypeOverride ?? "change-order");
  const documentType = documentTypeOverride ?? sanitizeDocumentType(saved.documentType, fallback.documentType);
  const typedFallback = {
    ...fallback,
    ...documentDefaults(documentType),
    documentType
  };

  return {
    documentType,
    documentTitle: stringValue(saved.documentTitle, typedFallback.documentTitle, 180),
    provider: stringValue(saved.provider, typedFallback.provider, 180),
    businessEmail: stringValue(saved.businessEmail, typedFallback.businessEmail, 180),
    businessPhone: stringValue(saved.businessPhone, typedFallback.businessPhone, 80),
    client: stringValue(saved.client, typedFallback.client, 180),
    project: stringValue(saved.project, typedFallback.project, 220),
    jobLocation: stringValue(saved.jobLocation, typedFallback.jobLocation, 240),
    originalScope: stringValue(saved.originalScope, typedFallback.originalScope),
    newRequest: stringValue(saved.newRequest, typedFallback.newRequest),
    scheduleImpact: stringValue(saved.scheduleImpact, typedFallback.scheduleImpact, 1200),
    startDate: dateValue(saved.startDate, typedFallback.startDate),
    endDate: dateValue(saved.endDate, typedFallback.endDate),
    clientResponsibilities: stringValue(
      saved.clientResponsibilities,
      typedFallback.clientResponsibilities,
      1800
    ),
    exclusions: stringValue(saved.exclusions, typedFallback.exclusions, 1800),
    changePolicy: stringValue(saved.changePolicy, typedFallback.changePolicy, 1800),
    cancellationTerms: stringValue(saved.cancellationTerms, typedFallback.cancellationTerms, 1800),
    laborHours: numberValue(saved.laborHours, typedFallback.laborHours, 0, 10000),
    hourlyRate: numberValue(saved.hourlyRate, typedFallback.hourlyRate, 0, 100000),
    materialsCost: numberValue(saved.materialsCost, typedFallback.materialsCost, 0, 100000000),
    marginPercent: numberValue(saved.marginPercent, typedFallback.marginPercent, 0, 80),
    rushPercent: numberValue(saved.rushPercent, typedFallback.rushPercent, 0, 100),
    depositPercent: numberValue(saved.depositPercent, typedFallback.depositPercent, 0, 100),
    approvalDeadline: dateValue(saved.approvalDeadline, typedFallback.approvalDeadline),
    paymentTiming: isAllowedValue(saved.paymentTiming, paymentTimingValues)
      ? saved.paymentTiming
      : typedFallback.paymentTiming,
    industry: isAllowedValue(saved.industry, industryValues) ? saved.industry : typedFallback.industry,
    tone: isAllowedValue(saved.tone, toneValues) ? saved.tone : typedFallback.tone,
    currency: normalizeCurrency(saved.currency, typedFallback.currency)
  };
}

export const sanitizeProjectDocumentInput = sanitizeChangeOrderInput;

export function calculatePrice(input: ProjectDocumentInput): PriceBreakdown {
  const laborHours = clampNumber(input.laborHours, 0, 10000);
  const hourlyRate = clampNumber(input.hourlyRate, 0, 100000);
  const materialsCost = clampNumber(input.materialsCost, 0, 100000000);
  const marginPercent = clampNumber(input.marginPercent, 0, 80);
  const rushPercent = clampNumber(input.rushPercent, 0, 100);
  const depositPercent = clampNumber(input.depositPercent, 0, 100);

  const cents = (value: number) => Math.round(value * 100);
  const labor = cents(laborHours * hourlyRate);
  const materials = cents(materialsCost);
  const subtotal = labor + materials;
  const marginAmount = Math.round((subtotal * marginPercent) / 100);
  const rushAmount = Math.round((subtotal * rushPercent) / 100);
  const total = subtotal + marginAmount + rushAmount;
  const depositAmount = Math.round((total * depositPercent) / 100);
  const balanceAmount = total - depositAmount;

  return {
    labor: labor / 100,
    materials: materials / 100,
    subtotal: subtotal / 100,
    marginAmount: marginAmount / 100,
    rushAmount: rushAmount / 100,
    total: total / 100,
    depositAmount: depositAmount / 100,
    balanceAmount: balanceAmount / 100
  };
}

export function formatMoney(value: number, currency = "USD") {
  const normalizedCurrency = normalizeCurrency(currency);
  const localeByCurrency: Record<string, string> = {
    AUD: "en-AU",
    CAD: "en-CA",
    GBP: "en-GB",
    NGN: "en-NG",
    USD: "en-US"
  };

  return new Intl.NumberFormat(localeByCurrency[normalizedCurrency] || "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string) {
  if (!value) {
    return "the agreed approval date";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "the agreed approval date";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatSchedule(input: ProjectDocumentInput) {
  const start = input.startDate ? formatDate(input.startDate) : "";
  const end = input.endDate ? formatDate(input.endDate) : "";

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `Starts ${start}`;
  }

  if (end) {
    return `Target completion ${end}`;
  }

  return input.scheduleImpact.trim() || "Schedule will be confirmed after approval.";
}

export function industryBoundary(industry: Industry) {
  const copy: Record<Industry, string> = {
    remodeling:
      "This document covers the visible finish work described above. Hidden conditions, material substitutions, code requirements, or schedule changes may require a separate written approval.",
    landscaping:
      "This document covers the site work described above. Weather delays, soil conditions, plant availability, or added disposal needs may require a separate written approval.",
    handyman:
      "This document covers only the tasks described above. Repairs uncovered during the work, new materials, or added troubleshooting may require a separate written approval.",
    "web-design":
      "This document covers the deliverables described above. Extra pages, revisions, integrations, content entry, or launch support may require a separate written approval.",
    creative:
      "This document covers the creative deliverables described above. Additional concepts, rounds, formats, usage rights, or rush timelines may require a separate written approval.",
    consulting:
      "This document covers the advisory work described above. Added meetings, analysis, documentation, or stakeholder reviews may require a separate written approval."
  };

  return copy[industry];
}

export function toneGreeting(input: ProjectDocumentInput) {
  if (input.tone === "formal") {
    return `Hello ${input.client || "there"},`;
  }

  return `Hi ${input.client || "there"},`;
}

export function toneOpening(input: ProjectDocumentInput) {
  if (input.documentType === "work-order") {
    const openings: Record<Tone, string> = {
      friendly:
        "I put together the work order so the scope, schedule, pricing, and approval details are clear before the job starts.",
      direct:
        "Please review the work order below so we can confirm the job scope, price, schedule, and payment terms before work begins.",
      formal:
        "Please review the work order below for the proposed project scope, pricing, schedule, and payment terms."
    };

    return openings[input.tone];
  }

  if (input.documentType === "service-agreement") {
    const openings: Record<Tone, string> = {
      friendly:
        "I prepared a simple service agreement starter so the scope, responsibilities, payment schedule, and change policy are documented before we begin.",
      direct:
        "Please review the service agreement starter below before the project is scheduled.",
      formal:
        "Please review the service agreement starter below for the proposed services, payment terms, exclusions, and approval language."
    };

    return openings[input.tone];
  }

  const openings: Record<Tone, string> = {
    friendly:
      "Thanks for the update. I put together the added scope, pricing, schedule impact, and approval details below so we can keep everything clear before I start the extra work.",
    direct:
      "I priced the added work you requested so we can approve it before it changes the schedule or budget.",
    formal:
      "Please review the change order below for the requested adjustment to the project scope."
  };

  return openings[input.tone];
}

export function paymentTerms(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  const total = formatMoney(breakdown.total, input.currency);
  const deposit = formatMoney(breakdown.depositAmount, input.currency);
  const balance = formatMoney(breakdown.balanceAmount, input.currency);

  if (input.paymentTiming === "deposit-before") {
    return `${deposit} is due before the work begins. The remaining ${balance} is due according to the approved invoice terms.`;
  }

  if (input.paymentTiming === "completion") {
    return `${total} is due when the work is complete.`;
  }

  return `${total} will be added to the next invoice as approved work.`;
}

export function validateChangeOrder(input: ProjectDocumentInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const label = documentTypeLabel(input.documentType).toLowerCase();

  if (!input.project.trim()) {
    errors.project = "Add the project or job name.";
  }

  if (!input.documentTitle.trim() && input.project.trim()) {
    errors.documentTitle = "Add a document title.";
  }

  if (!input.provider.trim()) {
    errors.provider = "Add your business name.";
  }

  if (input.businessEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.businessEmail)) {
    errors.businessEmail = "Use a valid contact email or leave it blank.";
  }

  if (!input.client.trim()) {
    errors.client = "Add the client name.";
  }

  if (input.documentType === "change-order" && !input.originalScope.trim()) {
    errors.originalScope = "Describe the original agreed scope.";
  }

  if (!input.newRequest.trim()) {
    errors.newRequest =
      input.documentType === "change-order"
        ? "Describe the added client request."
        : `Describe the ${label} scope of work.`;
  }

  if (input.laborHours < 0) {
    errors.laborHours = "Labor hours cannot be negative.";
  }

  if (input.hourlyRate < 0) {
    errors.hourlyRate = "Hourly rate cannot be negative.";
  }

  if (input.materialsCost < 0) {
    errors.materialsCost = "Materials cost cannot be negative.";
  }

  if (input.marginPercent < 0 || input.marginPercent > 80) {
    errors.marginPercent = "Use a markup from 0% to 80%.";
  }

  if (input.rushPercent < 0 || input.rushPercent > 100) {
    errors.rushPercent = "Use a rush fee from 0% to 100%.";
  }

  if (input.depositPercent < 0 || input.depositPercent > 100) {
    errors.depositPercent = "Use a deposit from 0% to 100%.";
  }

  return errors;
}

function getExternalLinkState(link: string | null | undefined, configuredLabel: string, fallback: string) {
  const trimmed = link?.trim() ?? "";

  if (!trimmed) {
    return {
      configured: false,
      href: "",
      label: fallback
    };
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported external link protocol");
    }

    return {
      configured: true,
      href: url.href,
      label: configuredLabel
    };
  } catch {
    return {
      configured: false,
      href: "",
      label: fallback
    };
  }
}

export function getPilotState(pilotLink?: string | null) {
  return getExternalLinkState(
    pilotLink,
    "Join paid approval-link pilot",
    "Paid pilot link not configured yet"
  );
}

export function getTemplateKitState(templateKitLink?: string | null) {
  return getExternalLinkState(templateKitLink, "Open template kit", "Template kit link not configured yet");
}

function contactLine(input: ProjectDocumentInput) {
  const details = [input.businessEmail.trim(), input.businessPhone.trim()].filter(Boolean);
  return details.length > 0 ? details.join(" | ") : "Contact details not provided";
}

function titleForInput(input: ProjectDocumentInput) {
  const typeLabel = documentTypeLabel(input.documentType).toLowerCase();
  return input.documentTitle.trim() || `${documentTypeLabel(input.documentType)} for ${input.project || "project"}` || typeLabel;
}

function scopeText(input: ProjectDocumentInput) {
  return input.newRequest.trim() || input.originalScope.trim() || "Scope of work not provided.";
}

function priceLines(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  return [
    `Labor: ${formatMoney(breakdown.labor, input.currency)}`,
    `Materials and direct costs: ${formatMoney(breakdown.materials, input.currency)}`,
    `Markup + overhead allowance: ${formatMoney(breakdown.marginAmount, input.currency)}`,
    `Rush + disruption fee: ${formatMoney(breakdown.rushAmount, input.currency)}`,
    `Total: ${formatMoney(breakdown.total, input.currency)}`,
    `Deposit: ${formatMoney(breakdown.depositAmount, input.currency)}`,
    `Balance: ${formatMoney(breakdown.balanceAmount, input.currency)}`
  ];
}

function summaryLines(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  return [
    `Business: ${input.provider || "Your business"}`,
    `Contact: ${contactLine(input)}`,
    `Client: ${input.client || "Client"}`,
    `Project: ${input.project || "Project"}`,
    `Job location: ${input.jobLocation || "Location not provided"}`,
    `Approval needed by: ${formatDate(input.approvalDeadline)}`,
    "",
    "Pricing:",
    `Labor: ${input.laborHours || 0} hours at ${formatMoney(input.hourlyRate || 0, input.currency)}/hour = ${formatMoney(breakdown.labor, input.currency)}`,
    `Materials and direct costs: ${formatMoney(breakdown.materials, input.currency)}`,
    `Markup + overhead allowance: ${clampNumber(input.marginPercent, 0, 80)}% = ${formatMoney(breakdown.marginAmount, input.currency)}`,
    `Rush + disruption fee: ${clampNumber(input.rushPercent, 0, 100)}% = ${formatMoney(breakdown.rushAmount, input.currency)}`,
    `Total: ${formatMoney(breakdown.total, input.currency)}`,
    `Deposit required: ${clampNumber(input.depositPercent, 0, 100)}% = ${formatMoney(breakdown.depositAmount, input.currency)}`
  ];
}

function generateChangeOrderDocument(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  const total = formatMoney(breakdown.total, input.currency);
  const deadline = formatDate(input.approvalDeadline);
  const terms = paymentTerms(input, breakdown);
  const boundary = industryBoundary(input.industry);
  const scheduleImpact = input.scheduleImpact.trim() || "No schedule impact noted.";
  const exclusions = input.exclusions.trim() || "No additional exclusions listed.";
  const summary = [
    ...summaryLines(input, breakdown),
    "",
    "Original scope:",
    input.originalScope || "Original scope not provided.",
    "",
    "Requested change:",
    input.newRequest || "Requested change not provided.",
    "",
    "Schedule impact:",
    scheduleImpact,
    "",
    "Exclusions:",
    exclusions,
    "",
    `Total change order amount: ${total}`
  ].join("\n");

  const approvalText =
    'Please reply "Approved" or sign below to confirm the added scope, price, schedule impact, exclusions, and payment terms. Once approved, this change order becomes part of the project record and will be scheduled with the remaining work.';

  const primaryDocument = [
    titleForInput(input).toUpperCase(),
    "",
    `Prepared by: ${input.provider || "Your business"}`,
    `Business contact: ${contactLine(input)}`,
    `Prepared for: ${input.client || "Client"}`,
    `Project: ${input.project || "Project"}`,
    `Approval deadline: ${deadline}`,
    "",
    "1. ORIGINAL APPROVED SCOPE",
    input.originalScope || "Original scope not provided.",
    "",
    "2. REQUESTED ADDED WORK",
    input.newRequest || "Requested change not provided.",
    "",
    "3. SCHEDULE IMPACT",
    scheduleImpact,
    "",
    "4. EXCLUSIONS AND SCOPE BOUNDARY",
    exclusions,
    boundary,
    "",
    "5. PRICE BREAKDOWN",
    ...priceLines(input, breakdown),
    "",
    "6. PAYMENT TERMS",
    terms,
    "",
    "7. CLIENT APPROVAL",
    approvalText,
    "",
    "Client name: ______________________________",
    "Signature: _________________________________",
    "Date: ______________________________________"
  ].join("\n");

  return {
    summary,
    approvalText,
    terms,
    primaryDocument,
    invoiceNote: [
      `Invoice note: Approved change order for ${input.project || "the project"}.`,
      `Added scope: ${input.newRequest || "Requested change not provided."}`,
      `Approved amount: ${total}.`,
      terms
    ].join(" "),
    followUpTemplate: [
      toneGreeting(input),
      "",
      `I wanted to follow up on the change order for ${input.project || "the project"}. The approval deadline is ${deadline}, and the added work will stay unscheduled until the scope, price, and payment terms are approved in writing.`,
      "",
      'A reply with "Approved" is enough for me to move it into the project record.',
      "",
      "Thanks,",
      input.provider || "Your business"
    ].join("\n"),
    checklist: [
      "Confirm the added work is outside the original scope.",
      "Get written approval before starting the additional work.",
      "Attach the approved document to the job file or invoice.",
      "Send the invoice note with the matching line item and total.",
      "Review your contract and local rules before using late fees or legal escalation."
    ]
  };
}

function generateWorkOrderDocument(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  const total = formatMoney(breakdown.total, input.currency);
  const terms = paymentTerms(input, breakdown);
  const schedule = formatSchedule(input);
  const boundary = industryBoundary(input.industry);
  const exclusions = input.exclusions.trim() || "No additional exclusions listed.";
  const responsibilities =
    input.clientResponsibilities.trim() || "Client responsibilities will be confirmed before scheduling.";
  const summary = [
    ...summaryLines(input, breakdown),
    "",
    "Scope of work:",
    scopeText(input),
    "",
    "Schedule:",
    schedule,
    "",
    "Client responsibilities:",
    responsibilities,
    "",
    "Exclusions:",
    exclusions,
    "",
    `Total work order amount: ${total}`
  ].join("\n");

  const approvalText =
    'Please reply "Approved" or sign below to authorize this work order, including the scope, schedule, price, exclusions, client responsibilities, and payment terms.';

  const primaryDocument = [
    titleForInput(input).toUpperCase(),
    "",
    `Prepared by: ${input.provider || "Your business"}`,
    `Business contact: ${contactLine(input)}`,
    `Prepared for: ${input.client || "Client"}`,
    `Project: ${input.project || "Project"}`,
    `Job location: ${input.jobLocation || "Location not provided"}`,
    `Schedule: ${schedule}`,
    "",
    "1. SCOPE OF WORK",
    scopeText(input),
    "",
    "2. CLIENT RESPONSIBILITIES",
    responsibilities,
    "",
    "3. EXCLUSIONS AND SCOPE BOUNDARY",
    exclusions,
    boundary,
    "",
    "4. PRICE BREAKDOWN",
    ...priceLines(input, breakdown),
    "",
    "5. PAYMENT TERMS",
    terms,
    "",
    "6. WORK ORDER APPROVAL",
    approvalText,
    "",
    "Client name: ______________________________",
    "Signature: _________________________________",
    "Date: ______________________________________"
  ].join("\n");

  return {
    summary,
    approvalText,
    terms,
    primaryDocument,
    invoiceNote: [
      `Invoice note: Approved work order for ${input.project || "the project"}.`,
      `Scope: ${scopeText(input)}`,
      `Approved amount: ${total}.`,
      terms
    ].join(" "),
    followUpTemplate: [
      toneGreeting(input),
      "",
      `I wanted to follow up on the work order for ${input.project || "the project"}. Once the scope, schedule, payment terms, and deposit are approved, I can move it into the job schedule.`,
      "",
      'A reply with "Approved" is enough for me to prepare the job record.',
      "",
      "Thanks,",
      input.provider || "Your business"
    ].join("\n"),
    checklist: [
      "Confirm the work order scope matches the job you intend to perform.",
      "List site access, client decisions, and owner-supplied materials before scheduling.",
      "Collect the required deposit before ordering materials or reserving labor.",
      "Attach the approved work order to the job file and invoice.",
      "Use a separate change order if the client adds scope after approval."
    ]
  };
}

function generateServiceAgreementDocument(input: ProjectDocumentInput, breakdown: PriceBreakdown) {
  const total = formatMoney(breakdown.total, input.currency);
  const terms = paymentTerms(input, breakdown);
  const schedule = formatSchedule(input);
  const boundary = industryBoundary(input.industry);
  const exclusions = input.exclusions.trim() || "No additional exclusions listed.";
  const responsibilities =
    input.clientResponsibilities.trim() || "Client responsibilities will be confirmed before work begins.";
  const changePolicy =
    input.changePolicy.trim() ||
    documentDefaults("service-agreement").changePolicy ||
    "Requested changes must be priced and approved in writing before they become part of the service scope.";
  const cancellationTerms =
    input.cancellationTerms.trim() ||
    documentDefaults("service-agreement").cancellationTerms ||
    "Cancellation terms should be reviewed before use.";
  const disclaimer =
    "This service agreement starter is a business template, not legal advice. Have legal terms reviewed for your location, trade, licensing rules, and contract requirements.";
  const summary = [
    ...summaryLines(input, breakdown),
    "",
    "Service scope:",
    scopeText(input),
    "",
    "Schedule:",
    schedule,
    "",
    "Client responsibilities:",
    responsibilities,
    "",
    "Change policy:",
    changePolicy,
    "",
    "Cancellation:",
    cancellationTerms,
    "",
    "Review notice:",
    disclaimer,
    "",
    `Total service agreement amount: ${total}`
  ].join("\n");

  const approvalText =
    "Please review and sign below to confirm the service scope, payment schedule, responsibilities, exclusions, change policy, cancellation language, and review notice.";

  const primaryDocument = [
    titleForInput(input).toUpperCase(),
    "",
    "SERVICE AGREEMENT STARTER",
    disclaimer,
    "",
    `Service provider: ${input.provider || "Your business"}`,
    `Provider contact: ${contactLine(input)}`,
    `Client: ${input.client || "Client"}`,
    `Project: ${input.project || "Project"}`,
    `Service location: ${input.jobLocation || "Location not provided"}`,
    `Estimated schedule: ${schedule}`,
    "",
    "1. SERVICE SCOPE",
    scopeText(input),
    "",
    "2. CLIENT RESPONSIBILITIES",
    responsibilities,
    "",
    "3. PAYMENT SCHEDULE",
    terms,
    "",
    "4. PRICE BREAKDOWN",
    ...priceLines(input, breakdown),
    "",
    "5. CHANGES TO SCOPE",
    changePolicy,
    "",
    "6. CANCELLATION",
    cancellationTerms,
    "",
    "7. EXCLUSIONS AND SCOPE BOUNDARY",
    exclusions,
    boundary,
    "",
    "8. CLIENT APPROVAL",
    approvalText,
    "",
    "Client name: ______________________________",
    "Signature: _________________________________",
    "Date: ______________________________________",
    "",
    "Provider signature: _________________________",
    "Date: ______________________________________"
  ].join("\n");

  return {
    summary,
    approvalText,
    terms,
    primaryDocument,
    invoiceNote: [
      `Invoice note: Approved service agreement starter for ${input.project || "the project"}.`,
      `Service scope: ${scopeText(input)}`,
      `Approved amount: ${total}.`,
      terms
    ].join(" "),
    followUpTemplate: [
      toneGreeting(input),
      "",
      `I wanted to follow up on the service agreement starter for ${input.project || "the project"}. Once the scope, responsibilities, payment terms, and approval block are confirmed, I can prepare the job schedule.`,
      "",
      "Please review the agreement language and let me know if anything needs to be clarified before signing.",
      "",
      "Thanks,",
      input.provider || "Your business"
    ].join("\n"),
    checklist: [
      "Review the agreement starter for your trade, location, and licensing requirements.",
      "Confirm the client responsibilities and excluded work are specific enough.",
      "Use a separate written change order for scope added after approval.",
      "Store the signed agreement with the job file and invoice records.",
      "Have legal terms reviewed before relying on cancellation, fee, lien, or dispute language."
    ]
  };
}

export function generateChangeOrder(input: ProjectDocumentInput): GeneratedProjectDocument {
  const clean = sanitizeChangeOrderInput(input);
  const breakdown = calculatePrice(clean);
  const documentTitle = titleForInput(clean);
  const label = documentTypeLabel(clean.documentType);
  const generated =
    clean.documentType === "work-order"
      ? generateWorkOrderDocument(clean, breakdown)
      : clean.documentType === "service-agreement"
        ? generateServiceAgreementDocument(clean, breakdown)
        : generateChangeOrderDocument(clean, breakdown);

  const clientEmail = [
    toneGreeting(clean),
    "",
    toneOpening(clean),
    "",
    `${label.toUpperCase()} SUMMARY`,
    generated.summary,
    "",
    "PAYMENT TERMS",
    generated.terms,
    "",
    "APPROVAL LANGUAGE",
    generated.approvalText,
    "",
    "SCOPE BOUNDARY",
    industryBoundary(clean.industry),
    "",
    "Thanks,",
    clean.provider || "Your business"
  ].join("\n");

  const fullDocument = [
    `${label.toUpperCase()} DOCUMENT`,
    generated.primaryDocument,
    "",
    "CLIENT EMAIL",
    clientEmail,
    "",
    "INVOICE NOTE",
    generated.invoiceNote,
    "",
    "FOLLOW-UP TEMPLATE",
    generated.followUpTemplate
  ].join("\n");

  return {
    breakdown,
    documentType: clean.documentType,
    documentTypeLabel: label,
    documentTitle,
    summary: generated.summary,
    email: clientEmail,
    clientEmail,
    approvalText: generated.approvalText,
    paymentTerms: generated.terms,
    invoiceNote: generated.invoiceNote,
    followUpTemplate: generated.followUpTemplate,
    checklist: generated.checklist,
    primaryDocument: generated.primaryDocument,
    changeOrderDocument: generated.primaryDocument,
    fullDocument
  };
}
