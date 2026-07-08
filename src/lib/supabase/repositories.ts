import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangeOrderRepository } from "@/lib/change-order-service";
import type { ChangeOrderInsert, ChangeOrderUpdate } from "@/lib/change-order-records";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseChangeOrderRepository(
  supabase: SupabaseClient<Database>
): ChangeOrderRepository {
  return {
    async insert(payload: ChangeOrderInsert) {
      return supabase.from("change_orders").insert(payload).select("*").single();
    },
    async update(userId: string, id: string, payload: ChangeOrderUpdate) {
      return supabase
        .from("change_orders")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
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
