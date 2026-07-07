import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";

export const metadata = {
  title: "Export unlocked",
  description: "Return to ChangeOrderKit after checkout."
};

export default function SuccessPage() {
  return (
    <main className="tool-shell py-14">
      <section className="utility-panel mx-auto max-w-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-teal-700" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-black text-slate-950">You are set.</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">
          This page is ready for a future payment redirect. For now, return to the generator
          and use print/save-as-PDF or text download.
        </p>
        <Link href="/" className="btn btn-primary mx-auto mt-6 w-fit">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Back to generator
        </Link>
      </section>
    </main>
  );
}
