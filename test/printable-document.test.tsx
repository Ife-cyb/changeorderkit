import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrintableDocument } from "../src/components/generator/output-panel";
import { createDefaultInput, generateChangeOrder } from "../src/lib/change-order";

describe("printable document contract", () => {
  it("keeps dated scheduling, notes, and the industry boundary in Print/PDF output", () => {
    const input = {
      ...createDefaultInput(undefined, "work-order"),
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      scheduleImpact: "Client access is limited to 9am-2pm."
    };
    const generated = generateChangeOrder(input);
    const html = renderToStaticMarkup(
      <PrintableDocument input={input} generated={generated} />
    );

    expect(html).toContain("August 1, 2026 to August 3, 2026");
    expect(html).toContain("Client access is limited to 9am-2pm.");
    expect(html).toContain(generated.scopeBoundary);
    expect(html).toContain("Client approval");
  });

  it("uses the same agreement clauses and signature parties as the text document", () => {
    const input = {
      ...createDefaultInput(undefined, "service-agreement"),
      changePolicy: "",
      cancellationTerms: ""
    };
    const generated = generateChangeOrder(input);
    const html = renderToStaticMarkup(
      <PrintableDocument input={input} generated={generated} />
    );

    expect(generated.primaryDocument).toContain(generated.changePolicyText);
    expect(generated.primaryDocument).toContain(generated.cancellationTermsText);
    expect(html).toContain(generated.changePolicyText);
    expect(html).toContain(generated.cancellationTermsText);
    expect(html).toContain(generated.disclaimerText);
    expect(html).toContain("Provider signature");
  });

  it("does not print a phantom deposit for completion payment timing", () => {
    const input = {
      ...createDefaultInput(undefined, "change-order"),
      paymentTiming: "completion" as const,
      depositPercent: 50
    };
    const generated = generateChangeOrder(input);
    const html = renderToStaticMarkup(
      <PrintableDocument input={input} generated={generated} />
    );

    expect(generated.breakdown.depositAmount).toBe(0);
    expect(generated.breakdown.balanceAmount).toBe(generated.breakdown.total);
    expect(html).toContain("$0.00");
    expect(html).toContain("$912.50 is due when the work is complete.");
  });
});
