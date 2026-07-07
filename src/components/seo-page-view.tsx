import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import type { SeoPage } from "@/lib/seo-pages";

export function SeoPageView({ page }: { page: SeoPage }) {
  return (
    <article className="tool-shell py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(300px,0.45fr)] lg:items-start">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-bold text-teal-800">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {page.kicker}
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            {page.description}
          </p>
          <Link href="/" className="btn btn-primary mt-6 w-fit">
            {page.primaryCta}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <aside className="utility-panel p-5">
          <h2 className="text-lg font-black text-slate-950">Fast workflow</h2>
          <ul className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              Enter original scope and the new request.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              Add labor, materials, margin, and deposit.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
              Copy the approval email before work begins.
            </li>
          </ul>
        </aside>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {page.sections.map((section) => (
          <section key={section.heading} className="utility-panel p-5">
            <h2 className="text-xl font-black text-slate-950">{section.heading}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
