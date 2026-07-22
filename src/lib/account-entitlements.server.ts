import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveEntitlementSnapshot,
  type AccountEntitlement,
  type SubscriptionEntitlementRecord
} from "@/lib/account-entitlements";
import type { Database } from "@/lib/supabase/types";

export async function resolveAccountEntitlement(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date()
): Promise<AccountEntitlement> {
  const [subscriptionRequest, documentCountRequest] = await Promise.allSettled([
    supabase
      .from("subscriptions")
      .select("plan,status,current_period_end,cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("change_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
  ]);

  const subscriptionResult =
    subscriptionRequest.status === "fulfilled" ? subscriptionRequest.value : null;
  const documentCountResult =
    documentCountRequest.status === "fulfilled" ? documentCountRequest.value : null;

  if (!subscriptionResult || subscriptionResult.error) {
    console.error("Account entitlement lookup failed; using Free access.", {
      code: subscriptionResult?.error?.code ?? "REQUEST_REJECTED",
      message:
        subscriptionResult?.error?.message ??
        (subscriptionRequest.status === "rejected" && subscriptionRequest.reason instanceof Error
          ? subscriptionRequest.reason.message
          : "The entitlement request did not complete.")
    });
  }

  if (!documentCountResult || documentCountResult.error) {
    console.error("Saved document count lookup failed; blocking new cloud saves safely.", {
      code: documentCountResult?.error?.code ?? "REQUEST_REJECTED",
      message:
        documentCountResult?.error?.message ??
        (documentCountRequest.status === "rejected" && documentCountRequest.reason instanceof Error
          ? documentCountRequest.reason.message
          : "The saved-document count request did not complete.")
    });
  }

  return resolveEntitlementSnapshot(
    {
      subscription: !subscriptionResult || subscriptionResult.error
        ? null
        : (subscriptionResult.data as SubscriptionEntitlementRecord | null),
      subscriptionVerified: Boolean(subscriptionResult && !subscriptionResult.error),
      savedDocumentCount: documentCountResult?.count ?? 0,
      savedDocumentCountVerified: Boolean(
        documentCountResult && !documentCountResult.error && documentCountResult.count !== null
      )
    },
    now
  );
}
