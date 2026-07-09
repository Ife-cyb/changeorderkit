export const metadata = {
  title: "Privacy Policy",
  description: "ChangeOrderKit privacy policy."
};

export default function PrivacyPage() {
  return (
    <article className="tool-shell py-12">
      <div className="utility-panel max-w-3xl p-5 sm:p-7">
        <p className="panel-kicker">Policy</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--ink)]">
          Privacy Policy
        </h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-[var(--ink-soft)]">
        <p>
          ChangeOrderKit is designed to work without an account. The generator stores drafts in
          your browser local storage so your work is not lost when you refresh.
        </p>
        <p>
          If you create an account, saved business settings and job documents are stored in the
          ChangeOrderKit Supabase database so you can reopen them later.
        </p>
        <p>
          If analytics are enabled on the hosting platform, they may collect standard aggregate
          usage events such as page views and button clicks. Do not enter sensitive personal,
          financial, medical, or legal information into the tool.
        </p>
        </div>
      </div>
    </article>
  );
}
