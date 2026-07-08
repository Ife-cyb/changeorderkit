export const metadata = {
  title: "Terms",
  description: "ChangeOrderKit terms of use."
};

export default function TermsPage() {
  return (
    <article className="tool-shell py-12">
      <div className="utility-panel max-w-3xl p-5 sm:p-7">
        <p className="panel-kicker">Terms</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--ink)]">Terms</h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-[var(--ink-soft)]">
        <p>
          ChangeOrderKit provides business templates and calculations for project communication.
          It does not provide legal, tax, accounting, or debt-collection advice.
        </p>
        <p>
          You are responsible for reviewing your contracts, local laws, client agreements, and
          professional requirements before sending any generated document.
        </p>
        <p>
          The tool is provided as-is for early MVP validation. Verify all numbers, wording, and
          payment terms before using them with a client.
        </p>
        </div>
      </div>
    </article>
  );
}
