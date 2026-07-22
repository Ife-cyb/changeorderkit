export const FREE_SAVED_DOCUMENT_LIMIT = 3 as const;

export type AccountPlan = "free" | "pro";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type SubscriptionEntitlementRecord = {
  plan: AccountPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type AccountEntitlement = {
  plan: AccountPlan;
  subscriptionStatus: SubscriptionStatus;
  hasProAccess: boolean;
  savedDocumentCount: number;
  savedDocumentLimit: typeof FREE_SAVED_DOCUMENT_LIMIT | null;
  canCreateDocument: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type EntitlementSnapshotInput = {
  subscription: SubscriptionEntitlementRecord | null;
  subscriptionVerified?: boolean;
  savedDocumentCount: number;
  savedDocumentCountVerified?: boolean;
};

function validFuturePeriodEnd(value: string | null, now: Date) {
  if (!value) {
    return false;
  }

  const periodEnd = Date.parse(value);
  return Number.isFinite(periodEnd) && periodEnd > now.getTime();
}

export function subscriptionHasProAccess(
  subscription: SubscriptionEntitlementRecord | null,
  now: Date
) {
  if (!subscription || subscription.plan !== "pro") {
    return false;
  }

  if (subscription.status === "cancelled") {
    return validFuturePeriodEnd(subscription.current_period_end, now);
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return false;
  }

  return (
    subscription.current_period_end === null ||
    validFuturePeriodEnd(subscription.current_period_end, now)
  );
}

export function resolveEntitlementSnapshot(
  {
    subscription,
    subscriptionVerified = true,
    savedDocumentCount,
    savedDocumentCountVerified = true
  }: EntitlementSnapshotInput,
  now: Date = new Date()
): AccountEntitlement {
  const verifiedSubscription = subscriptionVerified ? subscription : null;
  const hasProAccess = subscriptionHasProAccess(verifiedSubscription, now);
  const normalizedCount =
    savedDocumentCountVerified && Number.isFinite(savedDocumentCount)
      ? Math.max(0, Math.trunc(savedDocumentCount))
      : FREE_SAVED_DOCUMENT_LIMIT;
  const savedDocumentLimit = hasProAccess ? null : FREE_SAVED_DOCUMENT_LIMIT;

  return {
    plan: hasProAccess ? "pro" : "free",
    subscriptionStatus: verifiedSubscription?.status ?? "inactive",
    hasProAccess,
    savedDocumentCount: normalizedCount,
    savedDocumentLimit,
    canCreateDocument: savedDocumentLimit === null || normalizedCount < savedDocumentLimit,
    currentPeriodEnd: verifiedSubscription?.current_period_end ?? null,
    cancelAtPeriodEnd: verifiedSubscription?.cancel_at_period_end ?? false
  };
}
