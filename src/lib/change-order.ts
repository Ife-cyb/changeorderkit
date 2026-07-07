export type Tone = "friendly" | "direct" | "formal";

export type Industry =
  | "remodeling"
  | "landscaping"
  | "handyman"
  | "web-design"
  | "creative"
  | "consulting";

export type PaymentTiming = "deposit-before" | "completion" | "next-invoice";

export type ChangeOrderInput = {
  provider: string;
  client: string;
  project: string;
  originalScope: string;
  newRequest: string;
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
  summary: string;
  email: string;
  approvalText: string;
  paymentTerms: string;
  checklist: string[];
  fullDocument: string;
};

export type ValidationErrors = Partial<Record<keyof ChangeOrderInput, string>>;

export const defaultInput: ChangeOrderInput = {
  provider: "Greenline Remodeling",
  client: "Morgan Smith",
  project: "Kitchen backsplash refresh",
  originalScope:
    "Install white subway tile backsplash in kitchen, including standard grout, trim, and cleanup.",
  newRequest:
    "Add tile behind the coffee bar and switch to a herringbone pattern around the range.",
  laborHours: 6,
  hourlyRate: 85,
  materialsCost: 220,
  marginPercent: 25,
  rushPercent: 0,
  depositPercent: 50,
  approvalDeadline: nextDate(3),
  paymentTiming: "deposit-before",
  industry: "remodeling",
  tone: "friendly",
  currency: "USD"
};

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
    currency,
    maximumFractionDigits: 0
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
      "Thanks for the update. I put together the added scope and pricing below so we can keep everything clear before I start the extra work.",
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

  if (!input.provider.trim()) {
    errors.provider = "Add your business name.";
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

export function getPaymentState(paymentLink?: string | null) {
  const trimmed = paymentLink?.trim() ?? "";

  if (!trimmed) {
    return {
      configured: false,
      href: "",
      label: "Payment link not configured yet"
    };
  }

  return {
    configured: true,
    href: trimmed,
    label: "Unlock polished export"
  };
}

export function generateChangeOrder(input: ChangeOrderInput): GeneratedChangeOrder {
  const breakdown = calculatePrice(input);
  const total = formatMoney(breakdown.total, input.currency);
  const deadline = formatDate(input.approvalDeadline);
  const terms = paymentTerms(input, breakdown);
  const boundary = industryBoundary(input.industry);

  const summary = [
    `Business: ${input.provider || "Your business"}`,
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
    'Please reply "Approved" to confirm the added scope, price, and payment terms above. Once approved, this change order becomes part of the project record and will be scheduled with the remaining work.';

  const checklist = [
    "Confirm the added work is outside the original scope.",
    "Get written approval before starting the additional work.",
    "Keep the tone calm, specific, and tied to the project record.",
    "Store the approved change order with the invoice or job folder.",
    "Review your contract and local rules before using late fees or legal escalation."
  ];

  const email = [
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

  const fullDocument = [
    `CHANGE ORDER - ${input.project || "Project"}`,
    "",
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
    "CLIENT EMAIL",
    email
  ].join("\n");

  return {
    breakdown,
    summary,
    email,
    approvalText,
    paymentTerms: terms,
    checklist,
    fullDocument
  };
}
