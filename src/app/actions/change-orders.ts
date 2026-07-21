"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function search(path: string, values: Record<string, string>) {
  const params = new URLSearchParams(values);
  return `${path}?${params.toString()}`;
}

function redirectForContextError(error: string): never {
  redirect(search("/sign-in", { next: "/dashboard", error }));
}

function finishDashboardMutation(result: ChangeOrderActionResult, message: string): never {
  if (!result.ok) {
    redirect(search("/dashboard", { error: result.error }));
  }

  refreshSavedWork(result.id);
  redirect(search("/dashboard", { message }));
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

  if (result.ok) {
    refreshSavedWork(result.id);
  }

  return result;
}

export async function archiveChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const context = await actionContext();

  if (!context.ok) {
    redirectForContextError(context.error);
  }

  if (!id) {
    redirect(search("/dashboard", { error: "Choose a document to archive." }));
  }

  const result = await updateChangeOrderStatusWithRepository(
    context.repository,
    context.userId,
    id,
    "archived"
  );
  finishDashboardMutation(result, "Document archived.");
}

export async function reopenChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const context = await actionContext();

  if (!context.ok) {
    redirectForContextError(context.error);
  }

  if (!id) {
    redirect(search("/dashboard", { error: "Choose a document to reopen." }));
  }

  const result = await updateChangeOrderStatusWithRepository(
    context.repository,
    context.userId,
    id,
    "draft"
  );
  finishDashboardMutation(result, "Document reopened.");
}

export async function duplicateChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const context = await actionContext();

  if (!context.ok) {
    redirectForContextError(context.error);
  }

  if (!id) {
    redirect(search("/dashboard", { error: "Choose a document to duplicate." }));
  }

  const result = await duplicateChangeOrderWithRepository(context.repository, context.userId, id);
  finishDashboardMutation(result, "Document duplicated.");
}

export async function deleteChangeOrderFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const context = await actionContext();

  if (!context.ok) {
    redirectForContextError(context.error);
  }

  if (!id) {
    redirect(search("/dashboard", { error: "Choose a document to delete." }));
  }

  const result = await deleteChangeOrderWithRepository(context.repository, context.userId, id);
  finishDashboardMutation(result, "Document deleted.");
}
