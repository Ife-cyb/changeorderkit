"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { profileFromFormData } from "@/lib/change-order-records";
import { supabaseSetupMessage } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function search(path: string, values: Record<string, string>) {
  const params = new URLSearchParams(values);
  return `${path}?${params.toString()}`;
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(search("/settings", { error: supabaseSetupMessage }));
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";

  if (error || !userId) {
    redirect(search("/sign-in", { next: "/settings", error: "Sign in to update settings." }));
  }

  const profile = profileFromFormData(formData, userId, email);
  const { error: profileError } = await supabase.from("profiles").upsert(profile);

  if (profileError) {
    console.error("Settings profile update failed.", {
      code: profileError.code,
      message: profileError.message
    });
    redirect(
      search("/settings", {
        error: "Business defaults could not be saved. Please try again."
      })
    );
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect(search("/settings", { message: "Business defaults saved." }));
}
