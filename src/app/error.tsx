"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="tool-shell py-8 sm:py-12">
      <div className="utility-panel mx-auto max-w-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning)]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="panel-kicker">Temporary connection problem</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
              We could not load your saved workspace.
            </h1>
            <p className="mt-2 max-w-[60ch] leading-7 text-[var(--ink-soft)]">
              Your saved data has not been changed. Check your connection and try the request again.
            </p>
            <button className="btn btn-primary mt-4" type="button" onClick={reset}>
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
