import { describe, expect, it } from "vitest";
import {
  FREE_SAVED_DOCUMENT_LIMIT,
  resolveEntitlementSnapshot,
  type SubscriptionEntitlementRecord
} from "../src/lib/account-entitlements";

const now = new Date("2026-07-22T12:00:00.000Z");

function subscription(
  overrides: Partial<SubscriptionEntitlementRecord> = {}
): SubscriptionEntitlementRecord {
  return {
    plan: "pro",
    status: "active",
    current_period_end: "2026-08-22T12:00:00.000Z",
    cancel_at_period_end: false,
    ...overrides
  };
}

function resolve(
  record: SubscriptionEntitlementRecord | null,
  savedDocumentCount = 0,
  subscriptionVerified = true
) {
  return resolveEntitlementSnapshot(
    {
      subscription: record,
      subscriptionVerified,
      savedDocumentCount
    },
    now
  );
}

describe("account entitlement policy", () => {
  it("resolves a missing subscription to Free", () => {
    expect(resolve(null)).toMatchObject({
      plan: "free",
      subscriptionStatus: "inactive",
      hasProAccess: false,
      savedDocumentLimit: FREE_SAVED_DOCUMENT_LIMIT,
      subscriptionVerified: true,
      savedDocumentCountVerified: true,
      cloudSaveBlockReason: null
    });
  });

  it("resolves active and trialing Pro periods to unlimited access", () => {
    for (const status of ["active", "trialing"] as const) {
      expect(resolve(subscription({ status }), 27)).toMatchObject({
        plan: "pro",
        subscriptionStatus: status,
        hasProAccess: true,
        savedDocumentLimit: null,
        canCreateDocument: true
      });
    }
  });

  it("resolves an expired paid period to Free", () => {
    expect(
      resolve(subscription({ current_period_end: "2026-07-22T11:59:59.999Z" }))
    ).toMatchObject({
      plan: "free",
      hasProAccess: false,
      savedDocumentLimit: FREE_SAVED_DOCUMENT_LIMIT
    });

    expect(resolve(subscription({ status: "expired" }))).toMatchObject({
      plan: "free",
      subscriptionStatus: "expired",
      hasProAccess: false
    });
  });

  it("keeps cancelled Pro access only until the recorded paid period ends", () => {
    const beforeEnd = resolve(
      subscription({
        status: "cancelled",
        current_period_end: "2026-07-22T12:00:00.001Z"
      })
    );
    const atEnd = resolve(
      subscription({ status: "cancelled", current_period_end: now.toISOString() })
    );
    const withoutEnd = resolve(
      subscription({ status: "cancelled", current_period_end: null })
    );

    expect(beforeEnd.hasProAccess).toBe(true);
    expect(atEnd.hasProAccess).toBe(false);
    expect(withoutEnd.hasProAccess).toBe(false);
  });

  it("limits Free to three documents and leaves Pro unlimited", () => {
    expect(resolve(null, 2).canCreateDocument).toBe(true);
    expect(resolve(null, 3)).toMatchObject({
      savedDocumentLimit: 3,
      canCreateDocument: false,
      cloudSaveBlockReason: "free_limit_reached"
    });
    expect(resolve(subscription(), 300)).toMatchObject({
      savedDocumentLimit: null,
      canCreateDocument: true
    });
  });

  it("fails an unverified entitlement lookup safely to Free", () => {
    expect(resolve(subscription(), 1, false)).toMatchObject({
      plan: "free",
      subscriptionStatus: "inactive",
      hasProAccess: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    });
  });

  it("blocks creation conservatively when the document count is unverified", () => {
    expect(
      resolveEntitlementSnapshot(
        {
          subscription: null,
          savedDocumentCount: 0,
          savedDocumentCountVerified: false
        },
        now
      )
    ).toMatchObject({
      plan: "free",
      savedDocumentCount: 3,
      canCreateDocument: false,
      savedDocumentCountVerified: false,
      cloudSaveBlockReason: "verification_unavailable"
    });
  });
});
