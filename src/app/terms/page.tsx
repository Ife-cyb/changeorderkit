export const metadata = {
  title: "Terms",
  description: "ChangeOrderKit terms of use."
};

export default function TermsPage() {
  return (
    <article className="tool-shell max-w-3xl py-12">
      <h1 className="text-4xl font-black text-slate-950">Terms</h1>
      <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">
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
    </article>
  );
}
