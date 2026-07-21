import { describe, expect, it } from "vitest";
import {
  businessInitials,
  calculatePrice,
  createBlankInput,
  createDefaultInput,
  deadlineUrgency,
  defaultInput,
  documentTypeLabel,
  effectiveDepositPercent,
  formatDate,
  formatMoney,
  formatSchedule,
  generateChangeOrder,
  getPilotState,
  getTemplateKitState,
  isExampleInput,
  nextDate,
  sanitizeChangeOrderInput,
  validateChangeOrder
} from "../src/lib/change-order";
import { totalBucket } from "../src/lib/funnel";

describe("change order math", () => {
  const toCents = (value: number) => Math.round(value * 100);

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

  it("reconciles rounded pricing lines across seeded inputs", () => {
    let seed = 0x5eed1234;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    for (let index = 0; index < 200; index += 1) {
      const breakdown = calculatePrice({
        ...defaultInput,
        laborHours: random() * 120,
        hourlyRate: random() * 500,
        materialsCost: random() * 25_000,
        marginPercent: random() * 80,
        rushPercent: random() * 100,
        depositPercent: random() * 100
      });

      expect(
        toCents(breakdown.labor) +
          toCents(breakdown.materials) +
          toCents(breakdown.marginAmount) +
          toCents(breakdown.rushAmount)
      ).toBe(toCents(breakdown.total));
      expect(toCents(breakdown.depositAmount) + toCents(breakdown.balanceAmount)).toBe(
        toCents(breakdown.total)
      );
    }
  });

  it("reconciles the known fractional-cent pricing cases", () => {
    const cases = [
      {
        input: {
          laborHours: 1,
          hourlyRate: 33.33,
          materialsCost: 0,
          marginPercent: 0,
          rushPercent: 0,
          depositPercent: 50
        },
        formatted: ["$16.67", "$16.66", "$33.33"]
      },
      {
        input: {
          laborHours: 3,
          hourlyRate: 45.55,
          materialsCost: 220.13,
          marginPercent: 25,
          rushPercent: 0,
          depositPercent: 50
        },
        formatted: ["$222.99", "$222.99", "$445.98"]
      }
    ];

    for (const { input, formatted } of cases) {
      const breakdown = calculatePrice({ ...defaultInput, ...input });

      expect(toCents(breakdown.depositAmount) + toCents(breakdown.balanceAmount)).toBe(
        toCents(breakdown.total)
      );
      expect([
        formatMoney(breakdown.depositAmount),
        formatMoney(breakdown.balanceAmount),
        formatMoney(breakdown.total)
      ]).toEqual(formatted);
    }
  });

  it("only calculates a deposit when payment timing requires one", () => {
    const depositBefore = generateChangeOrder({
      ...defaultInput,
      paymentTiming: "deposit-before",
      depositPercent: 50
    });

    expect(effectiveDepositPercent({ paymentTiming: "deposit-before", depositPercent: 50 })).toBe(
      50
    );
    expect(depositBefore.breakdown.depositAmount).toBe(456.25);
    expect(depositBefore.breakdown.balanceAmount).toBe(456.25);

    for (const paymentTiming of ["completion", "next-invoice"] as const) {
      const generated = generateChangeOrder({
        ...defaultInput,
        paymentTiming,
        depositPercent: 50
      });

      expect(effectiveDepositPercent({ paymentTiming, depositPercent: 50 })).toBe(0);
      expect(generated.breakdown.depositAmount).toBe(0);
      expect(generated.breakdown.balanceAmount).toBe(generated.breakdown.total);
      expect(generated.summary).toContain("Deposit required: None for the selected payment timing.");
    }
  });

  it("keeps non-deposit work-order follow-up and checklist copy coherent", () => {
    const completion = generateChangeOrder({
      ...createDefaultInput(undefined, "work-order"),
      paymentTiming: "completion",
      depositPercent: 50
    });
    const nextInvoice = generateChangeOrder({
      ...createDefaultInput(undefined, "work-order"),
      paymentTiming: "next-invoice",
      depositPercent: 50
    });

    expect(completion.paymentTerms).toContain("due when the work is complete");
    expect(completion.followUpTemplate).not.toContain("and deposit");
    expect(completion.checklist).toContain("Confirm the full amount is due when the work is complete.");
    expect(nextInvoice.paymentTerms).toContain("added to the next invoice");
    expect(nextInvoice.followUpTemplate).not.toContain("and deposit");
    expect(nextInvoice.checklist).toContain(
      "Confirm the approved amount will be added to the next invoice."
    );

    const zeroDeposit = generateChangeOrder({
      ...createDefaultInput(undefined, "work-order"),
      paymentTiming: "deposit-before",
      depositPercent: 0
    });

    expect(zeroDeposit.paymentTerms).toContain("No deposit is required");
    expect(zeroDeposit.checklist).toContain(
      "Confirm the full amount and invoice terms before scheduling."
    );
  });
});

describe("generated copy", () => {
  it("builds default dates from the local calendar day", () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    expect(nextDate(0)).toBe(expected);
  });

  it("creates a blank input while preserving preferences and profile defaults", () => {
    const blank = createBlankInput(
      {
        businessName: "Northstar Repairs",
        contactEmail: "jobs@northstar.example",
        phone: "+234 800 000 0000",
        defaultHourlyRate: 125,
        defaultMarginPercent: 30,
        defaultDepositPercent: 40
      },
      "work-order"
    );

    expect(blank.documentType).toBe("work-order");
    expect(blank.documentTitle).toBe("");
    expect(blank.client).toBe("");
    expect(blank.newRequest).toBe("");
    expect(blank.laborHours).toBe(0);
    expect(blank.materialsCost).toBe(0);
    expect(blank.provider).toBe("Northstar Repairs");
    expect(blank.businessEmail).toBe("jobs@northstar.example");
    expect(blank.hourlyRate).toBe(125);
    expect(blank.marginPercent).toBe(30);
    expect(blank.depositPercent).toBe(40);
    expect(blank.approvalDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("detects examples across document types without mistaking blank or edited inputs", () => {
    for (const documentType of ["change-order", "work-order", "service-agreement"] as const) {
      expect(isExampleInput(createDefaultInput(undefined, documentType))).toBe(true);
    }

    expect(isExampleInput(createBlankInput())).toBe(false);
    expect(isExampleInput({ ...createDefaultInput(), client: "A different client" })).toBe(false);
  });

  it("recognizes profile-customized seeded examples without ignoring edited job content", () => {
    const profiledExample = createDefaultInput(
      {
        businessName: "Northstar Repairs",
        contactEmail: "jobs@northstar.example",
        phone: "+234 800 000 0000",
        defaultHourlyRate: 125,
        defaultMarginPercent: 30,
        defaultDepositPercent: 40,
        defaultPaymentTiming: "completion",
        defaultTone: "formal"
      },
      "work-order"
    );

    expect(
      isExampleInput({
        ...profiledExample,
        approvalDeadline: "2040-01-01",
        startDate: "2040-01-02",
        endDate: "2040-01-03"
      })
    ).toBe(true);
    expect(isExampleInput({ ...profiledExample, project: "A real customer job" })).toBe(false);
    expect(isExampleInput({ ...profiledExample, newRequest: "A real customer scope" })).toBe(false);
  });

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

  it("classifies deadlines from the local calendar day near midnight", () => {
    const previousTimezone = process.env.TZ;

    try {
      process.env.TZ = "Africa/Lagos";
      const localReferenceDate = new Date(2026, 6, 22, 0, 30);

      expect(localReferenceDate.toISOString().slice(0, 10)).toBe("2026-07-21");
      expect(deadlineUrgency("2026-07-21", localReferenceDate)).toBe("overdue");
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });

  it("preserves both dated scheduling and schedule notes", () => {
    const input = {
      ...createDefaultInput(undefined, "work-order"),
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      scheduleImpact: "Client access is limited to 9am-2pm."
    };
    const schedule =
      "August 1, 2026 to August 3, 2026. Client access is limited to 9am-2pm.";
    const generated = generateChangeOrder(input);

    expect(formatSchedule(input)).toBe(schedule);
    expect(generated.scheduleText).toBe(schedule);
    expect(generated.primaryDocument).toContain(`Schedule: ${schedule}`);
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
    expect(generated.primaryDocument).toContain(
      `Approval deadline: ${formatDate(input.approvalDeadline)}`
    );
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
    expect(generated.primaryDocument).toContain(
      `Approval deadline: ${formatDate(input.approvalDeadline)}`
    );
    expect(generated.primaryDocument).toContain(generated.changePolicyText);
    expect(generated.primaryDocument).toContain(generated.cancellationTermsText);
    expect(generated.primaryDocument).toContain(generated.disclaimerText);
    expect(generated.scopeBoundary).toContain("visible finish work");
  });

  it("exposes normalized service-agreement clauses for printable output", () => {
    const generated = generateChangeOrder({
      ...createBlankInput(undefined, "service-agreement"),
      documentTitle: "Service agreement for Oak Street",
      provider: "Northstar Repairs",
      client: "Jordan Lee",
      project: "Oak Street",
      newRequest: "Provide the listed repair services.",
      changePolicy: "",
      cancellationTerms: ""
    });

    expect(generated.changePolicyText).toContain("Requested changes, added work");
    expect(generated.cancellationTermsText).toContain("Either party may request cancellation");
    expect(generated.disclaimerText).toContain("not legal advice");
    expect(generated.primaryDocument).toContain(generated.changePolicyText);
    expect(generated.primaryDocument).toContain(generated.cancellationTermsText);
  });
});

describe("validation", () => {
  it("requires core project context", () => {
    const errors = validateChangeOrder({
      ...defaultInput,
      documentTitle: "",
      project: "",
      provider: "",
      client: "",
      originalScope: "",
      newRequest: ""
    });

    expect(errors.project).toBeTruthy();
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

  it("rejects a completion target before the start date", () => {
    const errors = validateChangeOrder({
      ...createDefaultInput(undefined, "work-order"),
      startDate: "2026-08-03",
      endDate: "2026-08-01"
    });

    expect(errors.endDate).toBe("Completion target cannot be before the start date.");
  });

  it("does not block non-deposit payment modes on an unused deposit percentage", () => {
    const completionErrors = validateChangeOrder({
      ...defaultInput,
      paymentTiming: "completion",
      depositPercent: 150
    });
    const depositErrors = validateChangeOrder({
      ...defaultInput,
      paymentTiming: "deposit-before",
      depositPercent: 150
    });

    expect(completionErrors.depositPercent).toBeUndefined();
    expect(depositErrors.depositPercent).toBeTruthy();
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

  it("rejects impossible calendar dates without rejecting valid leap dates", () => {
    const impossible = sanitizeChangeOrderInput({
      ...defaultInput,
      approvalDeadline: "2026-02-31",
      startDate: "2026-02-29"
    });
    const leapDate = sanitizeChangeOrderInput({
      ...defaultInput,
      approvalDeadline: "2028-02-29"
    });

    expect(impossible.approvalDeadline).not.toBe("2026-02-31");
    expect(impossible.startDate).not.toBe("2026-02-29");
    expect(formatDate("2026-02-31")).toBe("the agreed approval date");
    expect(leapDate.approvalDeadline).toBe("2028-02-29");
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
