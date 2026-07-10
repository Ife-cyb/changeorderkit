import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Reset password"
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);
  const message = first(params.message);

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
              Reset your password
            </h1>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-3 text-sm font-bold text-[var(--accent-strong)]">
            {message}
          </p>
        ) : null}

        <form action={requestPasswordResetAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Account email
            <input className="field-control" name="email" type="email" autoComplete="email" required />
          </label>
          <button className="btn btn-primary" type="submit">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
            Send reset link
          </button>
        </form>

        <p className="mt-5 text-sm leading-6 text-[var(--ink-soft)]">
          <Link className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
