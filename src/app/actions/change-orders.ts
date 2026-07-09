"use server";

import { revalidatePath } from "next/cache";
import {
  duplicateChangeOrderWithRepository,
  saveChangeOrderWithRepository,
  updateChangeOrderStatusWithRepository,
  deleteChangeOrderWithRepository,
  type ChangeOrderActionResult
} from "@/lib/change-order-service";
import type { ChangeOrderInput } from "@/lib/change-order";
import { createSupabaseChangeOrderRepository } from "@/lib/supabase/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function actionContext(): Promise<
  | {
      ok: true;
      userId: string;
      repository: ReturnType<typeof createSupabaseChangeOrderRepository>;
    }
  | {
      ok: false;
      error: string;
    }
> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Supabase is not configured yet."
    };
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (error || !userId) {
    return {
      ok: false,
      error: "Sign in to save documents."
    };
  }

  return {
    ok: true,
    userId,
    repository: createSupabaseChangeOrderRepository(supabase)
  };
}

function refreshSavedWork(id?: string | null) {
  revalidatePath("/");
  revalidatePath("/dashboard");

  if (id) {
    revalidatePath(`/dashboard/change-orders/${id}`);
    revalidatePath(`/dashboard/documents/${id}`);
  }
}

export async function saveChangeOrderAction(
  input: ChangeOrderInput,
  id?: string | null
): Promise<ChangeOrderActionResult> {
  const context = await actionContext();

  if (!context.ok) {
    return {
      ok: false,
      error: context.error
    };
  }

  const result = await saveChangeOrderWithRepository(context.repository, context.userId, input, id);
  refreshSavedWork(result.ok ? result.id : id);
  return result;
}

export async function archiveChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await actionContext();

  if (!context.ok || !id) {
    return;
  }

  await updateChangeOrderStatusWithRepository(context.repository, context.userId, id, "archived");
  refreshSavedWork(id);
}

export async function reopenChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await actionContext();

  if (!context.ok || !id) {
    return;
  }

  await updateChangeOrderStatusWithRepository(context.repository, context.userId, id, "draft");
  refreshSavedWork(id);
}

export async function duplicateChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await actionContext();

  if (!context.ok || !id) {
    return;
  }

  const result = await duplicateChangeOrderWithRepository(context.repository, context.userId, id);
  refreshSavedWork(result.ok ? result.id : id);
}

export async function deleteChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const context = await actionContext();

  if (!context.ok || !id) {
    return;
  }

  await deleteChangeOrderWithRepository(context.repository, context.userId, id);
  refreshSavedWork(id);
}
