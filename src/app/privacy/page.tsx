export const metadata = {
  title: "Privacy Policy",
  description: "ChangeOrderKit privacy policy."
};

export default function PrivacyPage() {
  return (
    <article className="tool-shell max-w-3xl py-12">
      <h1 className="text-4xl font-black text-slate-950">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">
        <p>
          ChangeOrderKit is designed to work without an account. The generator stores drafts in
          your browser local storage so your work is not lost when you refresh.
        </p>
        <p>
          The MVP does not use a database and does not intentionally collect client names,
          project details, or generated documents on our servers.
        </p>
        <p>
          If analytics are enabled on the hosting platform, they may collect standard aggregate
          usage events such as page views and button clicks. Do not enter sensitive personal,
          financial, medical, or legal information into the tool.
        </p>
      </div>
    </article>
  );
}
