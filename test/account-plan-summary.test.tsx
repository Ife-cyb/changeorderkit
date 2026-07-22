import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountPlanSummary } from "../src/components/account-plan-summary";
import type { AccountEntitlement } from "../src/lib/account-entitlements";

function entitlement(overrides: Partial<AccountEntitlement> = {}): AccountEntitlement {
  return {
    plan: "free",
    subscriptionStatus: "inactive",
    hasProAccess: false,
    savedDocumentCount: 2,
    savedDocumentLimit: 3,
    canCreateDocument: true,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides
  };
}

describe("account plan summary", () => {
  it("renders Free usage and keeps generation and exporting explicitly free", () => {
    const html = renderToStaticMarkup(
      <AccountPlanSummary entitlement={entitlement()} />
    );

    expect(html).toContain("Free plan");
    expect(html).toContain("2 of 3 saved documents");
    expect(html).toContain("document generation");
    expect(html).toContain("Print/PDF remain free");
    expect(html).toContain("Pro subscriptions are opening soon");
    expect(html).not.toContain("<a");
  });

  it("renders an upgrade link only when a valid configured pilot URL is enabled", () => {
    const invalid = renderToStaticMarkup(
      <AccountPlanSummary
        entitlement={entitlement()}
        pilotLink="javascript:alert(1)"
        showUpgradeLink
      />
    );
    const configured = renderToStaticMarkup(
      <AccountPlanSummary
        entitlement={entitlement()}
        pilotLink="https://example.com/pro-pilot"
        showUpgradeLink
      />
    );

    expect(invalid).not.toContain("<a");
    expect(configured).toContain('href="https://example.com/pro-pilot"');
    expect(configured).toContain("Ask about Pro access");
  });

  it("explains the reached Free limit without implying existing work was lost", () => {
    const html = renderToStaticMarkup(
      <AccountPlanSummary
        entitlement={entitlement({ savedDocumentCount: 4, canCreateDocument: false })}
      />
    );

    expect(html).toContain("4 of 3 saved documents");
    expect(html).toContain("Free cloud-save limit reached");
    expect(html).toContain("Your existing documents remain available");
    expect(html).toContain("copying, downloading, and printing");
  });

  it("renders unlimited Pro usage and cancellation-period information", () => {
    const html = renderToStaticMarkup(
      <AccountPlanSummary
        entitlement={
          entitlement({
            plan: "pro",
            subscriptionStatus: "active",
            hasProAccess: true,
            savedDocumentCount: 12,
            savedDocumentLimit: null,
            canCreateDocument: true,
            currentPeriodEnd: "2026-08-22T12:00:00.000Z",
            cancelAtPeriodEnd: true
          })
        }
      />
    );

    expect(html).toContain(">Pro<");
    expect(html).toContain("Unlimited saved documents");
    expect(html).toContain("Pro access continues through August 22, 2026");
    expect(html).not.toContain("Ask about Pro access");
  });
});
