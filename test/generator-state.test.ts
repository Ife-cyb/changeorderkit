import { describe, expect, it } from "vitest";
import { createBlankInput, createDefaultInput } from "../src/lib/change-order";
import {
  accountNewDraftStorageKey,
  automaticDocumentTitle,
  saveCompletionState,
  transitionDocumentType
} from "../src/lib/generator-state";

describe("generator document type transitions", () => {
  it("is idempotent when the selected document type is already active", () => {
    const blank = createBlankInput(undefined, "change-order");

    expect(transitionDocumentType(blank, "change-order")).toBe(blank);
    expect(transitionDocumentType(blank, "change-order").newRequest).toBe("");
  });

  it("preserves a blank user draft when changing document type", () => {
    const blank = createBlankInput(undefined, "change-order");
    const workOrder = transitionDocumentType(blank, "work-order");

    expect(workOrder.documentType).toBe("work-order");
    expect(workOrder.documentTitle).toBe("");
    expect(workOrder.originalScope).toBe("");
    expect(workOrder.newRequest).toBe("");
    expect(workOrder.scheduleImpact).toBe("");
    expect(workOrder.clientResponsibilities).toBe("");
    expect(workOrder.exclusions).toBe("");
  });

  it("updates an automatic project title while preserving the user's project", () => {
    const blank = {
      ...createBlankInput(undefined, "change-order"),
      project: "Roof repair",
      documentTitle: automaticDocumentTitle("change-order", "Roof repair")
    };
    const workOrder = transitionDocumentType(blank, "work-order");

    expect(workOrder.project).toBe("Roof repair");
    expect(workOrder.documentTitle).toBe("Work order for Roof repair");
    expect(workOrder.newRequest).toBe("");
  });

  it("preserves a custom title when changing document type", () => {
    const input = {
      ...createBlankInput(undefined, "change-order"),
      project: "Roof repair",
      documentTitle: "Variation 2026-014"
    };

    expect(transitionDocumentType(input, "service-agreement").documentTitle).toBe(
      "Variation 2026-014"
    );
  });

  it("transitions untouched example copy to the selected document type", () => {
    const profileExample = createDefaultInput(
      {
        businessName: "Northline Renovations",
        contactEmail: "jobs@northline.example",
        defaultHourlyRate: 125
      },
      "work-order"
    );
    const changeOrder = transitionDocumentType(profileExample, "change-order");
    const expected = createDefaultInput(undefined, "change-order");

    expect(changeOrder.documentTitle).toBe(expected.documentTitle);
    expect(changeOrder.originalScope).toBe(expected.originalScope);
    expect(changeOrder.newRequest).toBe(expected.newRequest);
    expect(changeOrder.provider).toBe("Northline Renovations");
    expect(changeOrder.businessEmail).toBe("jobs@northline.example");
    expect(changeOrder.hourlyRate).toBe(125);
  });
});

describe("generator save completion", () => {
  it("allows navigation when the saved revision is still current", () => {
    expect(saveCompletionState(4, 4)).toEqual({
      hasNewerEdits: false,
      shouldNavigateToSavedDocument: true
    });
  });

  it("keeps the editor open when the user changed it during the save", () => {
    expect(saveCompletionState(4, 5)).toEqual({
      hasNewerEdits: true,
      shouldNavigateToSavedDocument: false
    });
  });
});

describe("account-new browser draft isolation", () => {
  it("uses a different browser storage key for each authenticated user", () => {
    const first = accountNewDraftStorageKey("11111111-1111-4111-8111-111111111111");
    const second = accountNewDraftStorageKey("22222222-2222-4222-8222-222222222222");

    expect(first).not.toBe(second);
    expect(first).toContain("11111111-1111-4111-8111-111111111111");
  });
});
