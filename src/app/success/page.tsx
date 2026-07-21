import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";

export const metadata = {
  title: "Pilot interest received",
  description: "Return to ChangeOrderKit after registering interest in the paid pilot.",
  robots: {
    index: false,
    follow: false
  }
};

export default function SuccessPage() {
  return (
    <section className="tool-shell py-14" aria-labelledby="success-title">
      <section className="utility-panel mx-auto max-w-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--accent)]" aria-hidden="true" />
        <p className="panel-kicker mt-4 justify-center">Return route</p>
        <h1 id="success-title" className="mt-2 text-3xl font-black tracking-tight text-[var(--ink)]">
          Thanks for your interest.
        </h1>
        <p className="mx-auto mt-3 max-w-[65ch] text-base leading-7 text-[var(--ink-soft)]">
          This return page does not unlock a paid feature or verify payment. The current
          generator remains free while we validate approval links, signatures, and deposits with
          pilot customers.
        </p>
        <Link href="/" className="btn btn-primary mx-auto mt-6 w-fit">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Back to generator
        </Link>
      </section>
    </section>
  );
}
