import { describe, expect, it } from "vitest";
import {
  calculatePrice,
  createDefaultInput,
  defaultInput,
  formatMoney,
  generateChangeOrder,
  getPaymentState,
  sanitizeChangeOrderInput,
  validateChangeOrder
} from "../src/lib/change-order";

describe("change order math", () => {
  it("calculates labor, margin, deposit, and total", () => {
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
  it("includes approval and scope protection language", () => {
    const input = createDefaultInput();
    const generated = generateChangeOrder(input);

    expect(generated.fullDocument).toContain("CHANGE ORDER");
    expect(generated.fullDocument).toContain("Please reply \"Approved\"");
    expect(generated.fullDocument).toContain("SCOPE BOUNDARY");
    expect(generated.email).toContain(input.client);
  });
});

describe("validation", () => {
  it("requires core project context", () => {
    const errors = validateChangeOrder({
      ...defaultInput,
      provider: "",
      client: "",
      originalScope: "",
      newRequest: ""
    });

    expect(errors.provider).toBeTruthy();
    expect(errors.client).toBeTruthy();
    expect(errors.originalScope).toBeTruthy();
    expect(errors.newRequest).toBeTruthy();
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
      currency: "not-a-currency"
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
    expect(formatMoney(10, "not-a-currency")).toBe("$10.00");
  });
});

describe("payment state", () => {
  it("falls back safely when no payment link is configured", () => {
    expect(getPaymentState("").configured).toBe(false);
    expect(getPaymentState("").label).toBe("Payment link not configured yet");
  });

  it("uses the configured external payment URL", () => {
    const state = getPaymentState("https://example.com/pay");

    expect(state.configured).toBe(true);
    expect(state.href).toBe("https://example.com/pay");
  });

  it("rejects malformed or unsafe payment URLs", () => {
    expect(getPaymentState("not a url").configured).toBe(false);
    expect(getPaymentState("javascript:alert(1)").configured).toBe(false);
    expect(getPaymentState("ftp://example.com/pay").configured).toBe(false);
  });
});
