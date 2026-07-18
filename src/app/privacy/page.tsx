export const metadata = {
  title: "Privacy Policy",
  description: "How ChangeOrderKit collects, uses, stores, and protects personal information."
};

const headingClass = "text-2xl font-black tracking-tight text-[var(--ink)]";

export default function PrivacyPage() {
  return (
    <article className="tool-shell py-12">
      <div className="utility-panel max-w-3xl p-5 sm:p-7">
        <p className="panel-kicker">Policy</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--ink)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm font-bold text-[var(--muted)]">
          Last updated: 18 July 2026
        </p>

        <div className="mt-8 space-y-8 text-base leading-8 text-[var(--ink-soft)]">
          <section className="space-y-3">
            <h2 className={headingClass}>Who operates ChangeOrderKit</h2>
            <p>
              ChangeOrderKit is operated by Ifeoluwa Adegbite in Nigeria. This policy explains how
              personal information is handled when you use the website, create an account, save job
              documents, or interact with a paid pilot or external checkout.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Information we collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Account information:</strong> your email address, authentication status,
                account identifiers, and security-related timestamps.
              </li>
              <li>
                <strong>Business and document information:</strong> business profile details,
                customer and project information, original scope, additional work, pricing,
                schedule impact, payment terms, notes, and other content you choose to save.
              </li>
              <li>
                <strong>Browser drafts:</strong> unsigned drafts may be stored in your browser&apos;s
                local storage so work is not lost when you refresh.
              </li>
              <li>
                <strong>Usage information:</strong> aggregate events such as page views, generator
                use, selected industry and currency, broad price ranges, and button clicks.
              </li>
              <li>
                <strong>Transaction information:</strong> if you use an external checkout, the
                payment provider may return limited status or reference information. ChangeOrderKit
                does not intend to store full card or bank-account details.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>How we use information</h2>
            <p>We use information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>provide authentication, saved workspaces, calculations, and generated documents;</li>
              <li>secure accounts, diagnose errors, prevent abuse, and maintain service reliability;</li>
              <li>understand product usage and improve features and onboarding;</li>
              <li>operate paid pilots, verify access, and respond to support requests; and</li>
              <li>comply with applicable legal obligations and enforce the Terms of Use.</li>
            </ul>
            <p>
              Depending on your location, these activities rely on performing our agreement with
              you, legitimate interests in operating and improving the service, consent where
              required, and compliance with law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Service providers and international processing</h2>
            <p>
              ChangeOrderKit uses service providers including Supabase for authentication and
              database services, Resend for delivery of account and security emails, and Vercel for
              hosting, analytics, and application delivery. To deliver those emails, Resend
              processes recipient addresses, message content, and delivery metadata. External
              payment or checkout providers process information under their own privacy terms.
              These providers may process information outside your country, subject to their
              safeguards and applicable law.
            </p>
            <p>ChangeOrderKit does not sell personal information.</p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Analytics and data minimisation</h2>
            <p>
              Analytics events are designed not to include client names, project descriptions,
              detailed scope, email addresses, phone numbers, or exact document totals. Do not enter
              sensitive financial, medical, legal, identification, password, or account-security
              information into document fields.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Retention and deletion</h2>
            <p>
              Browser drafts remain until you reset the generator or clear the site&apos;s browser
              storage. Account and saved-document data is retained while your account is active and
              for as long as reasonably needed to provide the service, resolve disputes, secure the
              platform, or meet legal obligations.
            </p>
            <p>
              You may request access, correction, export, or deletion through the support channel
              from which you received access or any contact method displayed in the product. Some
              records may be retained where required by law or necessary to protect legal rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Security</h2>
            <p>
              We use reasonable technical and organisational safeguards, including authenticated
              accounts, password controls, encrypted connections, and owner-scoped database access.
              No internet service is completely secure, so you are responsible for protecting your
              password and signing out on shared devices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Your rights</h2>
            <p>
              Depending on applicable law, you may have rights to access, correct, delete, restrict,
              object to, or receive a copy of your personal information, and to withdraw consent.
              You may also have the right to complain to a relevant data-protection authority.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Children</h2>
            <p>
              ChangeOrderKit is intended for business users aged 18 or older and is not directed to
              children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={headingClass}>Policy changes</h2>
            <p>
              This policy may be updated as the product, providers, or legal requirements change.
              The revised date will be shown at the top of this page. Material changes may also be
              communicated in the product or by email where appropriate.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
