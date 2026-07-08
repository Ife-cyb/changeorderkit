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
      <div className="mx-auto max-w-xl">
        <div className="utility-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-slate-950">Create account</h1>
              <p className="mt-1 text-sm text-slate-600">
                Start saving drafts and business defaults.
              </p>
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
              {error}
            </p>
          ) : null}

          <form action={signUpAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Email
              <input className="field-control" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Password
              <input
                className="field-control"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              Create account
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-slate-700">
            Already have an account?{" "}
            <Link className="font-bold text-teal-800 hover:text-teal-900" href={`/sign-in?next=${encodeURIComponent(next)}`}>
              Sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
