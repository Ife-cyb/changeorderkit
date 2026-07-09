import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { signInAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Sign in"
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = first(params.next) || "/dashboard";
  const error = first(params.error);
  const message = first(params.message);

  return (
    <section className="tool-shell py-8 sm:py-12">
      <div className="auth-grid mx-auto max-w-5xl lg:grid-cols-[minmax(0,0.65fr)_minmax(300px,0.45fr)] lg:items-start">
        <div className="auth-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--ink)] text-[var(--paper)]">
              <LogIn className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="panel-kicker">Workspace access</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--ink)]">
                Sign in
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Save and reopen your job documents.
              </p>
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

          <form action={signInAction} className="grid gap-4">
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
                autoComplete="current-password"
                required
              />
            </label>
            <button className="btn btn-primary" type="submit">
              <LogIn className="h-5 w-5" aria-hidden="true" />
              Sign in
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-[var(--ink-soft)]">
            New to ChangeOrderKit?{" "}
            <Link className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]" href={`/sign-up?next=${encodeURIComponent(next)}`}>
              Create an account
            </Link>
            .
          </p>
        </div>
        <aside className="ledger-rail overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:oklch(0.77_0.04_155)]">
              Saved work
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--paper)]">
              Your job records stay tied to your account.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:oklch(0.86_0.012_115)]">
              Drafts, duplicates, archived records, and business defaults are available after
              sign-in.
            </p>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Dashboard</span>
            <strong className="font-mono text-sm">Protected</strong>
          </div>
          <div className="ledger-row">
            <span className="text-sm text-[color:oklch(0.78_0.014_115)]">Records</span>
            <strong className="font-mono text-sm">Owner-scoped</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
