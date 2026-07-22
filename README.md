# ChangeOrderKit

ChangeOrderKit helps contractors and service providers turn client scope changes into priced, approved work before they start extra work.

## Features

- Change order calculator
- Deterministic client email and approval text
- Scope-protection checklist
- Copy, text download, and print/save-as-PDF flow
- Draft autosave in the browser
- Supabase email/password accounts
- Saved change order dashboard
- Business defaults and branded document output
- Free and Pro account entitlements resolved from Supabase on the server
- Owner-scoped Postgres RLS policies and database-enforced cloud-save limits
- External Gumroad template-kit CTA through `NEXT_PUBLIC_TEMPLATE_KIT_LINK`
- Configurable paid-pilot link through `NEXT_PUBLIC_PILOT_LINK`
- SEO pages for template and calculator searches

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_PILOT_LINK`: optional interview, pilot-registration, or paid-pilot URL.
- `NEXT_PUBLIC_PAYMENT_LINK`: temporary fallback for the pilot URL; do not describe it as an entitlement until payment verification exists.
- `NEXT_PUBLIC_TEMPLATE_KIT_LINK`: optional Gumroad template-kit URL.
- `NEXT_PUBLIC_SHOW_UPSELLS`: set to `true` only when the configured pilot or template-kit links should be shown.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for accounts and saved work.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for browser/server auth.
- `NEXT_PUBLIC_SITE_URL`: optional canonical site URL.

The visitor generator works without Supabase or external links. Unconfigured upsells stay hidden instead of rendering unavailable controls.

## Free and Pro rules

Free includes:

- The full calculator and document generator
- Copy, text download, and Print/PDF
- Browser draft autosave where the generator enables it
- One business profile
- Up to three cloud-saved documents

Pro includes everything in Free plus unlimited cloud-saved documents. Future paid features must use the same server-side entitlement resolver instead of adding separate client-side plan checks.

Only `active` and `trialing` Pro subscriptions with an unexpired paid period grant access. A cancelled subscription keeps Pro access until its recorded `current_period_end`; a cancelled record without a future period end resolves to Free. `inactive`, `past_due`, and `expired` records do not grant Pro access.

Existing Free users with more than three saved documents keep every record and can view, edit, export, archive, reopen, and delete them. They cannot insert or duplicate another cloud document until they delete enough records to fall below the limit or receive Pro access. Generation, copy, download, and Print/PDF are never restricted.

## Apply database migrations

Apply every file in `supabase/migrations` in filename order before deploying application code that depends on it. For a linked Supabase project:

```bash
npx supabase migration list
npx supabase db push
```

Alternatively, run each unapplied migration in the Supabase SQL editor. The Pro foundation migration creates the provider-neutral `subscriptions` table, its owner-read RLS policy, private usage accounting, and the database trigger that enforces the Free limit. Apply the database migration before deploying the dashboard entitlement UI.

The auth-onboarding migration creates a profile for each confirmed or newly registered user and backfills existing accounts. The entitlement migration separately backfills saved-document usage without deleting or hiding existing work.

### Temporarily grant a test user Pro access

Run this only from the trusted Supabase SQL editor. Replace the placeholder email with the test account; do not add an in-app grant endpoint.

```sql
insert into public.subscriptions (
  user_id,
  plan,
  status,
  provider,
  current_period_end,
  cancel_at_period_end
)
select
  id,
  'pro',
  'active',
  'manual',
  now() + interval '30 days',
  false
from auth.users
where lower(email) = lower('test-user@example.com')
on conflict (user_id) do update
set
  plan = excluded.plan,
  status = excluded.status,
  provider = excluded.provider,
  current_period_end = excluded.current_period_end,
  cancel_at_period_end = excluded.cancel_at_period_end;
```

To revoke that test entitlement immediately:

```sql
update public.subscriptions
set
  status = 'expired',
  current_period_end = now(),
  cancel_at_period_end = false
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('test-user@example.com')
);
```

Manual entitlements are temporary operational tools. Once payment-provider webhooks are implemented, verified webhook events will become authoritative and manual grants should be reserved for controlled support or testing.

For hosted Supabase email authentication:

- Set the Supabase Site URL to `https://changeorderkit.vercel.app`.
- Add `https://changeorderkit.vercel.app/auth/callback` and `https://changeorderkit.vercel.app/auth/recovery` to the allowed redirect URLs.
- For token-hash confirmation emails, set the confirmation template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}`. Passing Supabase's `RedirectTo` variable preserves the app's same-origin post-confirmation destination; the route validates it before redirecting. The app also supports the standard PKCE callback route.
- Configure custom SMTP before a public launch so confirmation and recovery email volume is not limited by the hosted trial sender.

`NEXT_PUBLIC_*` values are browser-visible. Production values live in the Vercel project settings and must never be committed to git. Keep service-role keys and every server secret in Vercel environment variables; use an ignored `.env.local` file for local overrides.

## Verification

```bash
npm run check
```

This runs TypeScript, ESLint, tests, and a production build. After deploying, `GET /api/health` must report `{"status":"ok","supabaseConfigured":true}` before account features are considered ready.

## Deployment

The Vercel project is connected to this GitHub repository. Push feature branches for preview deployments first; promote to production only after auth, RLS, and browser QA are verified.
