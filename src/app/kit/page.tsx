import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, FileText, PackageCheck } from "lucide-react";
import { getTemplateKitState } from "@/lib/change-order";

export const metadata: Metadata = {
  title: "Template kit"
};

export default function KitPage() {
  const kitState = getTemplateKitState(process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK);

  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-teal-800">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            Gumroad template kit
          </p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Client-ready templates for contractors who need tighter project paperwork.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            The app stays free to use. The paid kit links out to Gumroad for checkout and file
            delivery, so ChangeOrderKit does not process payments or store purchase records.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {kitState.configured ? (
              <a className="btn btn-primary" href={kitState.href} target="_blank" rel="noreferrer">
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                {kitState.label}
              </a>
            ) : (
              <button className="btn btn-disabled" type="button">
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                {kitState.label}
              </button>
            )}
            <Link className="btn btn-secondary" href="/">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Use free generator
            </Link>
          </div>
        </div>

        <aside className="utility-panel p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Download className="h-5 w-5 text-teal-700" aria-hidden="true" />
            Kit contents
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
            {[
              "Printable change-order template",
              "Scope-creep email scripts",
              "Extra-work approval wording",
              "Invoice note and payment schedule examples",
              "Late invoice follow-up templates"
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
