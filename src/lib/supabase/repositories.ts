import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangeOrderRepository } from "@/lib/change-order-service";
import type { ChangeOrderInsert, ChangeOrderUpdate } from "@/lib/change-order-records";
import type { Database } from "@/lib/supabase/types";

function isMissingDocumentTypeColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("document_type"));
}

type PersistableChangeOrderPayload = ChangeOrderInsert | ChangeOrderUpdate;

function withoutDocumentType<T extends PersistableChangeOrderPayload>(payload: T): T {
  const rest = { ...payload };
  delete rest.document_type;
  return rest as T;
}

export function createSupabaseChangeOrderRepository(
  supabase: SupabaseClient<Database>
): ChangeOrderRepository {
  return {
    async insert(payload: ChangeOrderInsert) {
      const result = await supabase.from("change_orders").insert(payload).select("*").single();

      if (isMissingDocumentTypeColumn(result.error)) {
        return supabase.from("change_orders").insert(withoutDocumentType(payload)).select("*").single();
      }

      return result;
    },
    async update(userId: string, id: string, payload: ChangeOrderUpdate) {
      const result = await supabase
        .from("change_orders")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();

      if (isMissingDocumentTypeColumn(result.error)) {
        return supabase
          .from("change_orders")
          .update(withoutDocumentType(payload))
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
          .maybeSingle();
      }

      return result;
    },
    async get(userId: string, id: string) {
      return supabase
        .from("change_orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    },
    async delete(userId: string, id: string) {
      return supabase.from("change_orders").delete().eq("id", id).eq("user_id", userId);
    }
  };
}
