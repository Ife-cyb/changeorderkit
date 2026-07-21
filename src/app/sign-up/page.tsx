import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUpAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Create account"
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = first(params.next) || "/settings";
  const error = first(params.error);

  return (
    <section className="tool-shell py-8 sm:py-12">
      <div className="auth-grid mx-auto max-w-5xl lg:grid-cols-[minmax(0,0.65fr)_minmax(300px,0.45fr)] lg:items-start">
        <div className="auth-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--ink)] text-[var(--paper)]">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="panel-kicker">Workspace setup</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--ink)]">
                Create account
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Start saving drafts and business defaults.
              </p>
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-bold text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--paper-deep)] p-3 text-sm leading-6 text-[var(--ink-soft)]">
            <p>
              Use this form only for a new account. If you have registered this email before,
              signing up again will not replace the original password.
            </p>
            <p className="mt-2">
              <Link
                className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                href={`/sign-in?next=${encodeURIComponent(next)}`}
              >
                Sign in
              </Link>{" "}
              with the original password or{" "}
              <Link
                className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                href="/forgot-password"
              >
                reset your password
              </Link>
              .
            </p>
          </div>

          <form action={signUpAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Email
              <input className="field-control" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Password
              <input
                className="field-control"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              Create account
            </button>
          </form>

          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            New accounts must be confirmed by email. Check your inbox and spam folder after
            submitting.
          </p>

          <p className="mt-5 text-sm leading-6 text-[var(--ink-soft)]">
            Already have an account?{" "}
            <Link className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]" href={`/sign-in?next=${encodeURIComponent(next)}`}>
              Sign in
            </Link>
            .
          </p>
        </div>
        <aside className="ledger-rail overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:oklch(0.77_0.04_155)]">
              Phase 2 workspace
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--paper)]">
              One business profile, reusable on every document.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:oklch(0.86_0.012_115)]">
              Save your default rate, markup, deposit, tone, and contact details once.
            </p>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Password</span>
            <strong className="font-mono text-sm">12+ chars</strong>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Storage</span>
            <strong className="font-mono text-sm">Supabase</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
