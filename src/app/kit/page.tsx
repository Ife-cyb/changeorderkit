import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, FileText, PackageCheck } from "lucide-react";
import { getTemplateKitState } from "@/lib/change-order";

export const metadata: Metadata = {
  title: "Template kit"
};

export default function KitPage() {
  const kitState = getTemplateKitState(process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK);
  const showUpsells = process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true";

  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-start">
        <div>
          <p className="panel-kicker">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            Gumroad template kit
          </p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight tracking-tight text-[var(--ink)] sm:text-5xl">
            Client-ready templates for contractors who need tighter project paperwork.
          </h1>
          <p className="mt-4 max-w-[65ch] text-lg leading-8 text-[var(--ink-soft)]">
            The app stays free to use. The paid kit links out to Gumroad for checkout and file
            delivery, so ChangeOrderKit does not process payments or store purchase records.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {showUpsells && kitState.configured ? (
              <a className="btn btn-primary" href={kitState.href} target="_blank" rel="noreferrer">
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                {kitState.label}
              </a>
            ) : null}
            <Link className="btn btn-secondary" href="/">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Use free generator
            </Link>
          </div>
        </div>

        <aside className="ledger-rail overflow-hidden">
          <div className="p-5">
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-[var(--paper)]">
              <Download className="h-5 w-5 text-[color:oklch(0.77_0.04_155)]" aria-hidden="true" />
              Kit contents
            </h2>
          </div>
          <ul className="grid text-sm leading-6">
            {[
              "Printable change-order template",
              "Scope-creep email scripts",
              "Extra-work approval wording",
              "Invoice note and payment schedule examples",
              "Late invoice follow-up templates"
            ].map((item) => (
              <li key={item} className="ledger-row">
                <span className="flex gap-2 text-[color:oklch(0.86_0.012_115)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:oklch(0.77_0.04_155)]" />
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
