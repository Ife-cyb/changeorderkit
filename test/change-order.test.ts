import { describe, expect, it } from "vitest";
import {
  businessInitials,
  calculatePrice,
  createDefaultInput,
  deadlineUrgency,
  defaultInput,
  documentTypeLabel,
  formatMoney,
  generateChangeOrder,
  getPilotState,
  getTemplateKitState,
  sanitizeChangeOrderInput,
  validateChangeOrder
} from "../src/lib/change-order";
import { totalBucket } from "../src/lib/funnel";

describe("change order math", () => {
  it("calculates labor, markup, deposit, and total", () => {
    const breakdown = calculatePrice({
      ...defaultInput,
      laborHours: 6,
      hourlyRate: 85,
      materialsCost: 220,
      marginPercent: 25,
      rushPercent: 0,
      depositPercent: 50
    });

    expect(breakdown.labor).toBe(510);
    expect(breakdown.materials).toBe(220);
    expect(breakdown.marginAmount).toBe(182.5);
    expect(breakdown.total).toBe(912.5);
    expect(breakdown.depositAmount).toBe(456.25);
  });

  it("formats cents consistently across totals and payment terms", () => {
    const generated = generateChangeOrder(defaultInput);

    expect(formatMoney(912.5)).toBe("$912.50");
    expect(generated.summary).toContain("Total change order amount: $912.50");
    expect(generated.paymentTerms).toContain("$456.25");
  });
});

describe("generated copy", () => {
  it("derives stable business initials for printable branding", () => {
    expect(businessInitials("Greenline Remodeling")).toBe("GR");
    expect(businessInitials("BuildCo")).toBe("B");
    expect(businessInitials("  A & B Services  ")).toBe("AB");
    expect(businessInitials("")).toBe("—");
  });

  it("classifies approval deadline urgency by calendar day", () => {
    const referenceDate = new Date("2026-07-18T12:00:00.000Z");

    expect(deadlineUrgency("2026-07-17", referenceDate)).toBe("overdue");
    expect(deadlineUrgency("2026-07-18", referenceDate)).toBe("soon");
    expect(deadlineUrgency("2026-07-21", referenceDate)).toBe("soon");
    expect(deadlineUrgency("2026-07-22", referenceDate)).toBe("normal");
    expect(deadlineUrgency("not-a-date", referenceDate)).toBe("normal");
  });

  it("includes approval and scope protection language", () => {
    const input = createDefaultInput();
    const generated = generateChangeOrder(input);

    expect(generated.fullDocument).toContain("CHANGE ORDER");
    expect(generated.fullDocument).toContain("Please reply \"Approved\"");
    expect(generated.fullDocument).toContain("SCOPE BOUNDARY");
    expect(generated.fullDocument).toContain("INVOICE NOTE");
    expect(generated.fullDocument).toContain("FOLLOW-UP TEMPLATE");
    expect(generated.email).toContain(input.client);
  });

  it("includes phase 2 document fields in deterministic outputs", () => {
    const generated = generateChangeOrder({
      ...defaultInput,
      documentTitle: "Garage change order",
      scheduleImpact: "Adds two workdays.",
      exclusions: "Permit revisions are excluded."
    });

    expect(generated.documentTitle).toBe("Garage change order");
    expect(generated.changeOrderDocument).toContain("SCHEDULE IMPACT");
    expect(generated.changeOrderDocument).toContain("Adds two workdays.");
    expect(generated.changeOrderDocument).toContain("Permit revisions are excluded.");
    expect(generated.invoiceNote).toContain("Approved change order");
    expect(generated.followUpTemplate).toContain("follow up");
  });

  it("generates deterministic outputs for work orders", () => {
    const input = createDefaultInput(undefined, "work-order");
    const generated = generateChangeOrder(input);

    expect(documentTypeLabel(input.documentType)).toBe("Work order");
    expect(generated.fullDocument).toContain("WORK ORDER DOCUMENT");
    expect(generated.primaryDocument).toContain("SCOPE OF WORK");
    expect(generated.primaryDocument).toContain("CLIENT RESPONSIBILITIES");
    expect(generated.clientEmail).toContain("work order");
    expect(generated.invoiceNote).toContain("Approved work order");
  });

  it("generates deterministic outputs for service agreement starters", () => {
    const input = createDefaultInput(undefined, "service-agreement");
    const generated = generateChangeOrder(input);

    expect(documentTypeLabel(input.documentType)).toBe("Service agreement");
    expect(generated.fullDocument).toContain("SERVICE AGREEMENT DOCUMENT");
    expect(generated.primaryDocument).toContain("SERVICE AGREEMENT STARTER");
    expect(generated.primaryDocument).toContain("not legal advice");
    expect(generated.primaryDocument).toContain("CHANGES TO SCOPE");
    expect(generated.primaryDocument).toContain("CANCELLATION");
  });
});

describe("validation", () => {
  it("requires core project context", () => {
    const errors = validateChangeOrder({
      ...defaultInput,
      documentTitle: "",
      provider: "",
      client: "",
      originalScope: "",
      newRequest: ""
    });

    expect(errors.documentTitle).toBeTruthy();
    expect(errors.provider).toBeTruthy();
    expect(errors.client).toBeTruthy();
    expect(errors.originalScope).toBeTruthy();
    expect(errors.newRequest).toBeTruthy();
  });

  it("treats old saved drafts without a document type as change orders", () => {
    const sanitized = sanitizeChangeOrderInput({
      documentTitle: "Legacy saved row",
      provider: "Legacy Co",
      client: "Client",
      originalScope: "Original scope",
      newRequest: "Added request"
    });

    expect(sanitized.documentType).toBe("change-order");
    expect(generateChangeOrder(sanitized).primaryDocument).toContain("ORIGINAL APPROVED SCOPE");
  });

  it("uses document-specific validation for work orders and agreements", () => {
    const workOrderErrors = validateChangeOrder({
      ...createDefaultInput(undefined, "work-order"),
      originalScope: "",
      newRequest: ""
    });
    const agreementErrors = validateChangeOrder({
      ...createDefaultInput(undefined, "service-agreement"),
      originalScope: "",
      newRequest: ""
    });

    expect(workOrderErrors.originalScope).toBeUndefined();
    expect(workOrderErrors.newRequest).toBeTruthy();
    expect(agreementErrors.originalScope).toBeUndefined();
    expect(agreementErrors.newRequest).toBeTruthy();
  });

  it("sanitizes corrupted browser drafts before validation or formatting", () => {
    const sanitized = sanitizeChangeOrderInput({
      laborHours: "7.5",
      hourlyRate: Number.POSITIVE_INFINITY,
      marginPercent: 500,
      depositPercent: -20,
      approvalDeadline: "not-a-date",
      paymentTiming: "completion",
      industry: "bad-industry",
      tone: "bad-tone",
      currency: "not-a-currency",
      scheduleImpact: "x".repeat(1300),
      exclusions: "y".repeat(1900)
    });

    expect(sanitized.laborHours).toBe(7.5);
    expect(sanitized.hourlyRate).toBe(defaultInput.hourlyRate);
    expect(sanitized.marginPercent).toBe(80);
    expect(sanitized.depositPercent).toBe(0);
    expect(sanitized.approvalDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sanitized.paymentTiming).toBe("completion");
    expect(sanitized.industry).toBe(defaultInput.industry);
    expect(sanitized.tone).toBe(defaultInput.tone);
    expect(sanitized.currency).toBe("USD");
    expect(sanitized.scheduleImpact).toHaveLength(1200);
    expect(sanitized.exclusions).toHaveLength(1800);
    expect(formatMoney(10, "not-a-currency")).toBe("$10.00");
  });
});

describe("external links and funnel data", () => {
  it("falls back safely when no paid-pilot link is configured", () => {
    expect(getPilotState("").configured).toBe(false);
    expect(getPilotState("").label).toBe("Paid pilot link not configured yet");
  });

  it("uses the configured external pilot URL", () => {
    const state = getPilotState("https://example.com/pilot");

    expect(state.configured).toBe(true);
    expect(state.href).toBe("https://example.com/pilot");
    expect(state.label).toBe("Join paid approval-link pilot");
  });

  it("rejects malformed or unsafe pilot URLs", () => {
    expect(getPilotState("not a url").configured).toBe(false);
    expect(getPilotState("javascript:alert(1)").configured).toBe(false);
    expect(getPilotState("ftp://example.com/pilot").configured).toBe(false);
  });

  it("falls back safely when no template kit link is configured", () => {
    expect(getTemplateKitState("").configured).toBe(false);
    expect(getTemplateKitState("").label).toBe("Template kit link not configured yet");
    expect(getTemplateKitState("https://gumroad.com/l/changeorderkit").configured).toBe(true);
  });

  it("buckets totals instead of exposing exact client prices to analytics", () => {
    expect(totalBucket(0)).toBe("0");
    expect(totalBucket(499)).toBe("1-499");
    expect(totalBucket(1_999)).toBe("500-1999");
    expect(totalBucket(4_999)).toBe("2000-4999");
    expect(totalBucket(5_000)).toBe("5000+");
  });
});
