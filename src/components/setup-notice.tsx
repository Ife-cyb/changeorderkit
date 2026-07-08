import { AlertTriangle } from "lucide-react";
import { supabaseSetupMessage } from "@/lib/supabase/config";

export function SetupNotice({ title = "Account setup needed" }: { title?: string }) {
  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="utility-panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 max-w-3xl leading-7 text-slate-700">{supabaseSetupMessage}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
