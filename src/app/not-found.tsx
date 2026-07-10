import Link from "next/link";

export default function NotFound() {
  return (
    <section className="tool-shell py-14" aria-labelledby="not-found-title">
      <section className="utility-panel mx-auto max-w-xl p-6 text-center">
        <h1 id="not-found-title" className="text-3xl font-black tracking-tight text-[var(--ink)]">
          Page not found
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          That page is not part of the ChangeOrderKit workspace.
        </p>
        <Link href="/" className="btn btn-primary mx-auto mt-6 w-fit">
          Back to generator
        </Link>
      </section>
    </section>
  );
}
