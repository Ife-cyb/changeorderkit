import { describe, expect, it } from "vitest";
import {
  calculatePrice,
  defaultInput,
  generateChangeOrder,
  getPaymentState,
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
});

describe("generated copy", () => {
  it("includes approval and scope protection language", () => {
    const generated = generateChangeOrder(defaultInput);

    expect(generated.fullDocument).toContain("CHANGE ORDER");
    expect(generated.fullDocument).toContain("Please reply \"Approved\"");
    expect(generated.fullDocument).toContain("SCOPE BOUNDARY");
    expect(generated.email).toContain(defaultInput.client);
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
});
