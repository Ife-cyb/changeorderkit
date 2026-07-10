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
          If analytics are enabled on the hosting platform, they collect aggregate usage events
          such as generator views, selected industry and currency, broad price ranges, and button
          clicks. Analytics events do not include your client name, project description, scope,
          email address, phone number, or exact document total.
        </p>
        <p>
          Do not enter sensitive financial, medical, legal, identification, or account-security
          information into document fields. You can clear an unsigned browser draft by using the
          generator&apos;s reset control or clearing this site&apos;s storage in your browser.
        </p>
        </div>
      </div>
    </article>
  );
}
