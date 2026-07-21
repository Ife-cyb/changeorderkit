"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth-redirect";
import { profileToDefaultSettings } from "@/lib/change-order-records";
import { supabaseSetupMessage } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultBusinessProfile } from "@/lib/change-order";

function search(path: string, values: Record<string, string>) {
  const params = new URLSearchParams(values);
  return `${path}?${params.toString()}`;
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const url = new URL(configured || "https://changeorderkit.vercel.app");

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported site URL protocol");
    }

    return url.origin;
  } catch {
    return "https://changeorderkit.vercel.app";
  }
}

function authCallback(next: string) {
  const callback = new URL("/auth/callback", siteUrl());
  callback.searchParams.set("next", safeNextPath(next, "/settings"));
  return callback.toString();
}

function recoveryCallback() {
  return new URL("/auth/recovery", siteUrl()).toString();
}

function logAuthError(
  operation: string,
  error: { code?: string; message: string; status?: number }
) {
  console.error(`Supabase Auth ${operation} failed.`, {
    code: error.code,
    message: error.message,
    status: error.status
  });
}

function friendlySignInError(code: string | undefined, message: string) {
  if (code === "email_not_confirmed" || message.toLowerCase().includes("email not confirmed")) {
    return "Confirm your email before signing in. Check your inbox and spam folder, or request another confirmation below.";
  }

  if (code === "invalid_credentials" || message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password is not correct. If you created this account before, use the original password or reset it below—creating the account again does not replace its password.";
  }

  return "We could not sign you in. Please try again.";
}

function friendlyEmailError(code: string | undefined) {
  if (code === "email_address_not_authorized") {
    return "Email delivery is not available for that address yet. Please try again later.";
  }

  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "Too many email requests were made. Wait a few minutes, then try again.";
  }

  return "We could not complete the email request. Please try again.";
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
    logAuthError("sign-in", error);
    redirect(search("/sign-in", { next, error: friendlySignInError(error.code, error.message) }));
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
      emailRedirectTo: authCallback(next)
    }
  });

  if (error) {
    logAuthError("sign-up", error);
    redirect(search("/sign-up", { next, error: friendlyEmailError(error.code) }));
  }

  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      contact_email: email,
      business_name: "",
      phone: "",
      default_settings: profileToDefaultSettings(defaultBusinessProfile)
    });

    if (profileError) {
      console.error("Post-signup profile initialization failed.", {
        code: profileError.code,
        message: profileError.message
      });
    }

    redirect(next);
  }

  redirect(
    search("/sign-in", {
      next,
      message:
        "If this is a new account, check your inbox and spam folder for a confirmation link. If you created the account before, use the original password or reset it—signing up again does not change an existing password."
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
      emailRedirectTo: authCallback(next)
    }
  });

  if (error) {
    logAuthError("confirmation resend", error);
    redirect(search("/sign-in", { next, error: friendlyEmailError(error.code) }));
  }

  redirect(
    search("/sign-in", {
      next,
      message:
        "If the account is still awaiting confirmation, a new email is on its way. Already-confirmed accounts do not receive another confirmation; reset the password if you cannot sign in."
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
    logAuthError("password-reset request", error);
    redirect(search("/forgot-password", { error: friendlyEmailError(error.code) }));
  }

  redirect(
    search("/forgot-password", {
      message:
        "If an account exists for that email, a password-reset link is on its way. Check your inbox and spam folder."
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
    logAuthError("password update", error);
    redirect(
      search("/update-password", {
        error: "We could not update the password. Request a new recovery link and try again."
      })
    );
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
