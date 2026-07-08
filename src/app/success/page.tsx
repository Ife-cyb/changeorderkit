import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";

export const metadata = {
  title: "Export unlocked",
  description: "Return to ChangeOrderKit after checkout."
};

export default function SuccessPage() {
  return (
    <section className="tool-shell py-14" aria-labelledby="success-title">
      <section className="utility-panel mx-auto max-w-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--accent)]" aria-hidden="true" />
        <p className="panel-kicker mt-4 justify-center">Return route</p>
        <h1 id="success-title" className="mt-2 text-3xl font-black tracking-tight text-[var(--ink)]">
          You are set.
        </h1>
        <p className="mx-auto mt-3 max-w-[65ch] text-base leading-7 text-[var(--ink-soft)]">
          This page is ready for a future payment redirect. For now, return to the generator
          and use print/save-as-PDF or text download.
        </p>
        <Link href="/" className="btn btn-primary mx-auto mt-6 w-fit">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Back to generator
        </Link>
      </section>
    </section>
  );
}
