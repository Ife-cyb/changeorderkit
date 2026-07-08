import { AlertTriangle } from "lucide-react";
import { supabaseSetupMessage } from "@/lib/supabase/config";

export function SetupNotice({ title = "Account setup needed" }: { title?: string }) {
  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="utility-panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--warning)]" aria-hidden="true" />
          <div>
            <p className="panel-kicker">Configuration</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">{title}</h1>
            <p className="mt-2 max-w-[65ch] leading-7 text-[var(--ink-soft)]">
              {supabaseSetupMessage}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
