"use server";

import { redirect } from "next/navigation";
import { profileToDefaultSettings } from "@/lib/change-order-records";
import { supabaseSetupMessage } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultBusinessProfile } from "@/lib/change-order";

function safeNextPath(value: FormDataEntryValue | null, fallback = "/dashboard") {
  const raw = typeof value === "string" ? value : "";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  return raw;
}

function search(path: string, values: Record<string, string>) {
  const params = new URLSearchParams(values);
  return `${path}?${params.toString()}`;
}

export async function signInAction(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(search("/sign-in", { next, error: supabaseSetupMessage }));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(search("/sign-in", { next, error: error.message }));
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const next = safeNextPath(formData.get("next"), "/settings");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(search("/sign-up", { next, error: supabaseSetupMessage }));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    redirect(search("/sign-up", { next, error: error.message }));
  }

  if (data.user && data.session) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      contact_email: email,
      business_name: "",
      phone: "",
      default_settings: profileToDefaultSettings(defaultBusinessProfile)
    });

    redirect(next);
  }

  redirect(
    search("/sign-in", {
      next,
      message: "Check your email to confirm your account, then sign in."
    })
  );
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
