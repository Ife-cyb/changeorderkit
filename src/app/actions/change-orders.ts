"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AUTH_REQUIRED,
  AUTH_VERIFICATION_FAILED,
  duplicateChangeOrderWithRepository,
  SERVICE_NOT_CONFIGURED,
  saveChangeOrderWithRepository,
  updateChangeOrderStatusWithRepository,
  deleteChangeOrderWithRepository,
  type ChangeOrderActionErrorCode,
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
      code: ChangeOrderActionErrorCode;
    }
> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      code: SERVICE_NOT_CONFIGURED,
      error: "Supabase is not configured yet."
    };
  }

  let claimsResult: Awaited<ReturnType<typeof supabase.auth.getClaims>>;

  try {
    claimsResult = await supabase.auth.getClaims();
  } catch (error) {
    console.error("Change order session verification did not complete.", {
      message: error instanceof Error ? error.message : "Unknown authentication failure"
    });
    return {
      ok: false,
      code: AUTH_VERIFICATION_FAILED,
      error:
        "We couldn't verify your session. Your document is still here; check your connection and try again."
    };
  }

  const { data, error } = claimsResult;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (error) {
    return {
      ok: false,
      code: AUTH_VERIFICATION_FAILED,
      error:
        "We couldn't verify your session. Your document is still here; check your connection and try again."
    };
  }

  if (!userId) {
    return {
      ok: false,
      code: AUTH_REQUIRED,
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

function redirectForContextError(error: string, code: ChangeOrderActionErrorCode): never {
  if (code === AUTH_REQUIRED) {
    redirect(search("/sign-in", { next: "/dashboard", error }));
  }

  redirect(search("/dashboard", { error }));
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
      code: context.code,
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
    redirectForContextError(context.error, context.code);
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
    redirectForContextError(context.error, context.code);
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
    redirectForContextError(context.error, context.code);
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
    redirectForContextError(context.error, context.code);
  }

  if (!id) {
    redirect(search("/dashboard", { error: "Choose a document to delete." }));
  }

  const result = await deleteChangeOrderWithRepository(context.repository, context.userId, id);
  finishDashboardMutation(result, "Document deleted.");
}
