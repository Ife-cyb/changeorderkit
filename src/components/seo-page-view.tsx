import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import type { SeoPage } from "@/lib/seo-pages";

export function SeoPageView({ page }: { page: SeoPage }) {
  return (
    <article className="tool-shell py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(300px,0.45fr)] lg:items-start">
        <div>
          <p className="panel-kicker mb-3">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {page.kicker}
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-[var(--ink)] sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-[65ch] text-lg leading-8 text-[var(--ink-soft)]">
            {page.description}
          </p>
          <Link href="/" className="btn btn-primary mt-6 w-fit">
            {page.primaryCta}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <aside className="ledger-rail overflow-hidden">
          <div className="p-5">
            <h2 className="text-lg font-black tracking-tight text-[var(--paper)]">
              Fast workflow
            </h2>
          </div>
          {[
            "Choose the document type that matches the job.",
            "Add scope, pricing, schedule, and payment terms.",
            "Copy, save, print, or send the approval packet."
          ].map((item) => (
            <div key={item} className="ledger-row">
              <span className="flex gap-2 text-sm text-[color:oklch(0.86_0.012_115)]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:oklch(0.77_0.04_155)]" aria-hidden="true" />
                {item}
              </span>
            </div>
          ))}
        </aside>
      </div>

      <div className="workspace-panel mt-10 px-5">
        {page.sections.map((section) => (
          <section key={section.heading} className="workspace-row">
            <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">
              {section.heading}
            </h2>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-[var(--ink-soft)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
