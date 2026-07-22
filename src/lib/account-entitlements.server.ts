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
  const [subscriptionResult, documentCountResult] = await Promise.all([
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

  if (subscriptionResult.error) {
    console.error("Account entitlement lookup failed; using Free access.", {
      code: subscriptionResult.error.code,
      message: subscriptionResult.error.message
    });
  }

  if (documentCountResult.error) {
    console.error("Saved document count lookup failed; blocking new cloud saves safely.", {
      code: documentCountResult.error.code,
      message: documentCountResult.error.message
    });
  }

  return resolveEntitlementSnapshot(
    {
      subscription: subscriptionResult.error
        ? null
        : (subscriptionResult.data as SubscriptionEntitlementRecord | null),
      subscriptionVerified: !subscriptionResult.error,
      savedDocumentCount: documentCountResult.count ?? 0,
      savedDocumentCountVerified: !documentCountResult.error && documentCountResult.count !== null
    },
    now
  );
}
