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

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configured || "https://changeorderkit.vercel.app").origin;
  } catch {
    return "https://changeorderkit.vercel.app";
  }
}

function authCallback() {
  return new URL("/auth/callback", siteUrl()).toString();
}

function recoveryCallback() {
  return new URL("/auth/recovery", siteUrl()).toString();
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

  if (password.length < 12) {
    redirect(search("/sign-up", { next, error: "Use a password with at least 12 characters." }));
  }

  if (!supabase) {
    redirect(search("/sign-up", { next, error: supabaseSetupMessage }));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authCallback()
    }
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

export async function resendConfirmationAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNextPath(formData.get("next"), "/settings");
  const supabase = await createSupabaseServerClient();

  if (!email) {
    redirect(search("/sign-in", { next, error: "Enter the email used to create your account." }));
  }

  if (!supabase) {
    redirect(search("/sign-in", { next, error: supabaseSetupMessage }));
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: authCallback()
    }
  });

  if (error) {
    redirect(search("/sign-in", { next, error: error.message }));
  }

  redirect(
    search("/sign-in", {
      next,
      message: "If that account is awaiting confirmation, a new email is on its way."
    })
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await createSupabaseServerClient();

  if (!email) {
    redirect(search("/forgot-password", { error: "Enter your account email." }));
  }

  if (!supabase) {
    redirect(search("/forgot-password", { error: supabaseSetupMessage }));
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: recoveryCallback()
  });

  if (error) {
    redirect(search("/forgot-password", { error: error.message }));
  }

  redirect(
    search("/forgot-password", {
      message: "If an account exists for that email, a password-reset link is on its way."
    })
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  const supabase = await createSupabaseServerClient();

  if (password.length < 12) {
    redirect(search("/update-password", { error: "Use a password with at least 12 characters." }));
  }

  if (password !== confirmation) {
    redirect(search("/update-password", { error: "The passwords do not match." }));
  }

  if (!supabase) {
    redirect(search("/update-password", { error: supabaseSetupMessage }));
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(search("/update-password", { error: error.message }));
  }

  redirect(search("/settings", { message: "Password updated." }));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
