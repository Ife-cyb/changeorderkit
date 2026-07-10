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
- Owner-scoped Postgres RLS policies
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
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for accounts and saved work.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for browser/server auth.
- `NEXT_PUBLIC_SITE_URL`: optional canonical site URL.

The visitor generator works without Supabase or external links and shows clear fallback messages.

Apply every migration in `supabase/migrations` in filename order before enabling the Supabase env vars in Vercel. The auth-onboarding migration creates a profile for each confirmed or newly registered user and backfills existing accounts.

For hosted Supabase email authentication:

- Set the Supabase Site URL to `https://changeorderkit.vercel.app`.
- Add `https://changeorderkit.vercel.app/auth/callback` and `https://changeorderkit.vercel.app/auth/recovery` to the allowed redirect URLs.
- For token-hash confirmation emails, set the confirmation template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. The app also supports the standard PKCE callback route.
- Configure custom SMTP before a public launch so confirmation and recovery email volume is not limited by the hosted trial sender.

Keep deployed values in Vercel environment variables. Do not commit `.env.production`; use `.env.local` for local values.

## Verification

```bash
npm run check
```

This runs TypeScript, ESLint, tests, and a production build. After deploying, `GET /api/health` must report `{"status":"ok","supabaseConfigured":true}` before account features are considered ready.

## Deployment

The Vercel project is connected to this GitHub repository. Push feature branches for preview deployments first; promote to production only after auth, RLS, and browser QA are verified.
