export type Tone = "friendly" | "direct" | "formal";

export type Industry =
  | "remodeling"
  | "landscaping"
  | "handyman"
  | "web-design"
  | "creative"
  | "consulting";

export type PaymentTiming = "deposit-before" | "completion" | "next-invoice";

export type ChangeOrderStatus = "draft" | "ready" | "archived";

export type ChangeOrderInput = {
  documentTitle: string;
  provider: string;
  businessEmail: string;
  businessPhone: string;
  client: string;
  project: string;
  originalScope: string;
  newRequest: string;
  scheduleImpact: string;
  exclusions: string;
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

export type SavedChangeOrder = {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  projectName: string;
  status: ChangeOrderStatus;
  input: ChangeOrderInput;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

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

export type GeneratedChangeOrder = {
  breakdown: PriceBreakdown;
  documentTitle: string;
  summary: string;
  email: string;
  clientEmail: string;
  approvalText: string;
  paymentTerms: string;
  invoiceNote: string;
  followUpTemplate: string;
  checklist: string[];
  changeOrderDocument: string;
  fullDocument: string;
};

export type ValidationErrors = Partial<Record<keyof ChangeOrderInput, string>>;

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

export const defaultInput: ChangeOrderInput = {
  documentTitle: "Change order for kitchen backsplash refresh",
  provider: "Greenline Remodeling",
  businessEmail: "hello@greenlineremodeling.com",
  businessPhone: "(555) 014-2338",
  client: "Morgan Smith",
  project: "Kitchen backsplash refresh",
  originalScope:
    "Install white subway tile backsplash in kitchen, including standard grout, trim, and cleanup.",
  newRequest:
    "Add tile behind the coffee bar and switch to a herringbone pattern around the range.",
  scheduleImpact: "Adds one workday after materials arrive.",
  exclusions:
    "Electrical work, hidden wall repairs, permit fees, and owner-supplied material delays are excluded unless approved separately.",
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

export function createDefaultInput(profile?: Partial<BusinessProfile>): ChangeOrderInput {
  const base = {
    ...defaultInput,
    approvalDeadline: nextDate(3)
  };

  return profile ? applyBusinessProfileDefaults(base, profile) : base;
}

export function applyBusinessProfileDefaults(
  input: ChangeOrderInput,
  profile: Partial<BusinessProfile>
): ChangeOrderInput {
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
  return date.toISOString().slice(0, 10);
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

export function sanitizeChangeOrderInput(value: unknown): ChangeOrderInput {
  const saved =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<Record<keyof ChangeOrderInput, unknown>>)
      : {};
  const fallback = createDefaultInput();

  return {
    documentTitle: stringValue(saved.documentTitle, fallback.documentTitle, 180),
    provider: stringValue(saved.provider, fallback.provider, 180),
    businessEmail: stringValue(saved.businessEmail, fallback.businessEmail, 180),
    businessPhone: stringValue(saved.businessPhone, fallback.businessPhone, 80),
    client: stringValue(saved.client, fallback.client, 180),
    project: stringValue(saved.project, fallback.project, 220),
    originalScope: stringValue(saved.originalScope, fallback.originalScope),
    newRequest: stringValue(saved.newRequest, fallback.newRequest),
    scheduleImpact: stringValue(saved.scheduleImpact, fallback.scheduleImpact, 1200),
    exclusions: stringValue(saved.exclusions, fallback.exclusions, 1800),
    laborHours: numberValue(saved.laborHours, fallback.laborHours, 0, 10000),
    hourlyRate: numberValue(saved.hourlyRate, fallback.hourlyRate, 0, 100000),
    materialsCost: numberValue(saved.materialsCost, fallback.materialsCost, 0, 100000000),
    marginPercent: numberValue(saved.marginPercent, fallback.marginPercent, 0, 80),
    rushPercent: numberValue(saved.rushPercent, fallback.rushPercent, 0, 100),
    depositPercent: numberValue(saved.depositPercent, fallback.depositPercent, 0, 100),
    approvalDeadline: dateValue(saved.approvalDeadline, fallback.approvalDeadline),
    paymentTiming: isAllowedValue(saved.paymentTiming, paymentTimingValues)
      ? saved.paymentTiming
      : fallback.paymentTiming,
    industry: isAllowedValue(saved.industry, industryValues) ? saved.industry : fallback.industry,
    tone: isAllowedValue(saved.tone, toneValues) ? saved.tone : fallback.tone,
    currency: normalizeCurrency(saved.currency, fallback.currency)
  };
}

export function calculatePrice(input: ChangeOrderInput): PriceBreakdown {
  const laborHours = clampNumber(input.laborHours, 0, 10000);
  const hourlyRate = clampNumber(input.hourlyRate, 0, 100000);
  const materials = clampNumber(input.materialsCost, 0, 100000000);
  const marginPercent = clampNumber(input.marginPercent, 0, 80);
  const rushPercent = clampNumber(input.rushPercent, 0, 100);
  const depositPercent = clampNumber(input.depositPercent, 0, 100);

  const labor = laborHours * hourlyRate;
  const subtotal = labor + materials;
  const marginAmount = subtotal * (marginPercent / 100);
  const rushAmount = subtotal * (rushPercent / 100);
  const total = subtotal + marginAmount + rushAmount;
  const depositAmount = total * (depositPercent / 100);
  const balanceAmount = total - depositAmount;

  return {
    labor,
    materials,
    subtotal,
    marginAmount,
    rushAmount,
    total,
    depositAmount,
    balanceAmount
  };
}

export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrency(currency),
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

export function industryBoundary(industry: Industry) {
  const copy: Record<Industry, string> = {
    remodeling:
      "This change order covers the visible finish work described above. Hidden conditions, material substitutions, code requirements, or schedule changes may require a separate written approval.",
    landscaping:
      "This change order covers the site work described above. Weather delays, soil conditions, plant availability, or added disposal needs may require a separate written approval.",
    handyman:
      "This change order covers only the tasks described above. Repairs uncovered during the work, new materials, or added troubleshooting may require a separate written approval.",
    "web-design":
      "This change order covers the deliverables described above. Extra pages, revisions, integrations, content entry, or launch support may require a separate written approval.",
    creative:
      "This change order covers the creative deliverables described above. Additional concepts, rounds, formats, usage rights, or rush timelines may require a separate written approval.",
    consulting:
      "This change order covers the additional advisory work described above. Added meetings, analysis, documentation, or stakeholder reviews may require a separate written approval."
  };

  return copy[industry];
}

export function toneGreeting(input: ChangeOrderInput) {
  if (input.tone === "formal") {
    return `Hello ${input.client || "there"},`;
  }

  return `Hi ${input.client || "there"},`;
}

export function toneOpening(input: ChangeOrderInput) {
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

export function paymentTerms(input: ChangeOrderInput, breakdown: PriceBreakdown) {
  const total = formatMoney(breakdown.total, input.currency);
  const deposit = formatMoney(breakdown.depositAmount, input.currency);
  const balance = formatMoney(breakdown.balanceAmount, input.currency);

  if (input.paymentTiming === "deposit-before") {
    return `${deposit} is due before the additional work begins. The remaining ${balance} is due according to the project invoice terms.`;
  }

  if (input.paymentTiming === "completion") {
    return `${total} is due when the added work is complete.`;
  }

  return `${total} will be added to the next invoice as an approved change order.`;
}

export function validateChangeOrder(input: ChangeOrderInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.documentTitle.trim()) {
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

  if (!input.originalScope.trim()) {
    errors.originalScope = "Describe the original agreed scope.";
  }

  if (!input.newRequest.trim()) {
    errors.newRequest = "Describe the added client request.";
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
    errors.marginPercent = "Use a margin from 0% to 80%.";
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

export function getPaymentState(paymentLink?: string | null) {
  return getExternalLinkState(paymentLink, "Unlock polished export", "Payment link not configured yet");
}

export function getTemplateKitState(templateKitLink?: string | null) {
  return getExternalLinkState(templateKitLink, "Open template kit", "Template kit link not configured yet");
}

function contactLine(input: ChangeOrderInput) {
  const details = [input.businessEmail.trim(), input.businessPhone.trim()].filter(Boolean);
  return details.length > 0 ? details.join(" | ") : "Contact details not provided";
}

function titleForInput(input: ChangeOrderInput) {
  return input.documentTitle.trim() || `Change order for ${input.project || "project"}`;
}

export function generateChangeOrder(input: ChangeOrderInput): GeneratedChangeOrder {
  const breakdown = calculatePrice(input);
  const total = formatMoney(breakdown.total, input.currency);
  const deadline = formatDate(input.approvalDeadline);
  const terms = paymentTerms(input, breakdown);
  const boundary = industryBoundary(input.industry);
  const documentTitle = titleForInput(input);
  const scheduleImpact = input.scheduleImpact.trim() || "No schedule impact noted.";
  const exclusions = input.exclusions.trim() || "No additional exclusions listed.";

  const summary = [
    `Business: ${input.provider || "Your business"}`,
    `Contact: ${contactLine(input)}`,
    `Client: ${input.client || "Client"}`,
    `Project: ${input.project || "Project"}`,
    `Approval needed by: ${deadline}`,
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
    "Price breakdown:",
    `Extra labor: ${input.laborHours || 0} hours at ${formatMoney(input.hourlyRate || 0, input.currency)}/hour = ${formatMoney(breakdown.labor, input.currency)}`,
    `Materials and direct costs: ${formatMoney(breakdown.materials, input.currency)}`,
    `Margin/overhead allowance: ${clampNumber(input.marginPercent, 0, 80)}% = ${formatMoney(breakdown.marginAmount, input.currency)}`,
    `Rush/disruption fee: ${clampNumber(input.rushPercent, 0, 100)}% = ${formatMoney(breakdown.rushAmount, input.currency)}`,
    "",
    `Total change order amount: ${total}`,
    `Deposit required: ${clampNumber(input.depositPercent, 0, 100)}% = ${formatMoney(breakdown.depositAmount, input.currency)}`
  ].join("\n");

  const approvalText =
    'Please reply "Approved" or sign below to confirm the added scope, price, schedule impact, exclusions, and payment terms. Once approved, this change order becomes part of the project record and will be scheduled with the remaining work.';

  const checklist = [
    "Confirm the added work is outside the original scope.",
    "Get written approval before starting the additional work.",
    "Attach the approved document to the job file or invoice.",
    "Send the invoice note with the matching line item and total.",
    "Review your contract and local rules before using late fees or legal escalation."
  ];

  const clientEmail = [
    toneGreeting(input),
    "",
    toneOpening(input),
    "",
    "CHANGE ORDER SUMMARY",
    summary,
    "",
    "PAYMENT TERMS",
    terms,
    "",
    "APPROVAL LANGUAGE",
    approvalText,
    "",
    "SCOPE BOUNDARY",
    boundary,
    "",
    "Thanks,",
    input.provider || "Your business"
  ].join("\n");

  const changeOrderDocument = [
    documentTitle.toUpperCase(),
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
    `Labor: ${formatMoney(breakdown.labor, input.currency)}`,
    `Materials and direct costs: ${formatMoney(breakdown.materials, input.currency)}`,
    `Margin/overhead: ${formatMoney(breakdown.marginAmount, input.currency)}`,
    `Rush/disruption: ${formatMoney(breakdown.rushAmount, input.currency)}`,
    `Total: ${total}`,
    `Deposit: ${formatMoney(breakdown.depositAmount, input.currency)}`,
    `Balance: ${formatMoney(breakdown.balanceAmount, input.currency)}`,
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

  const invoiceNote = [
    `Invoice note: Approved change order for ${input.project || "the project"}.`,
    `Added scope: ${input.newRequest || "Requested change not provided."}`,
    `Approved amount: ${total}.`,
    terms
  ].join(" ");

  const followUpTemplate = [
    toneGreeting(input),
    "",
    `I wanted to follow up on the change order for ${input.project || "the project"}. The approval deadline is ${deadline}, and the added work will stay unscheduled until the scope, price, and payment terms are approved in writing.`,
    "",
    'A reply with "Approved" is enough for me to move it into the project record.',
    "",
    "Thanks,",
    input.provider || "Your business"
  ].join("\n");

  const fullDocument = [
    "CHANGE ORDER DOCUMENT",
    changeOrderDocument,
    "",
    "CLIENT EMAIL",
    clientEmail,
    "",
    "INVOICE NOTE",
    invoiceNote,
    "",
    "FOLLOW-UP TEMPLATE",
    followUpTemplate
  ].join("\n");

  return {
    breakdown,
    documentTitle,
    summary,
    email: clientEmail,
    clientEmail,
    approvalText,
    paymentTerms: terms,
    invoiceNote,
    followUpTemplate,
    checklist,
    changeOrderDocument,
    fullDocument
  };
}
