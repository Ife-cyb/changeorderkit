import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";
import { SetupNotice } from "@/components/setup-notice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a new password"
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpdatePasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return <SetupNotice title="Connect Supabase to update your password" />;
  }

  const { data } = await supabase.auth.getClaims();

  if (typeof data?.claims?.sub !== "string") {
    redirect("/forgot-password?error=Open+the+password-reset+link+from+your+email.");
  }

  return (
    <section className="tool-shell py-8 sm:py-12">
      <div className="auth-panel mx-auto max-w-xl p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--ink)] text-[var(--paper)]">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="panel-kicker">Account recovery</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--ink)]">
              Choose a new password
            </h1>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <form action={updatePasswordAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            New password
            <input className="field-control" name="password" type="password" autoComplete="new-password" minLength={12} required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Confirm new password
            <input className="field-control" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required />
          </label>
          <button className="btn btn-primary" type="submit">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
            Update password
          </button>
        </form>
      </div>
    </section>
  );
}
