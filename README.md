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
- Configurable checkout link through `NEXT_PUBLIC_PAYMENT_LINK`
- SEO pages for template and calculator searches

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_PAYMENT_LINK`: optional external checkout URL.
- `NEXT_PUBLIC_TEMPLATE_KIT_LINK`: optional Gumroad template-kit URL.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for accounts and saved work.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for browser/server auth.
- `NEXT_PUBLIC_SITE_URL`: optional canonical site URL.

The visitor generator works without Supabase or payment links and shows clear fallback messages.

Apply `supabase/migrations/20260708000000_phase_2_accounts.sql` before enabling the Supabase env vars in Vercel.

## Verification

```bash
npm run check
```

This runs TypeScript, ESLint, tests, and a production build.

## Deployment

The Vercel project is connected to this GitHub repository. Push feature branches for preview deployments first; promote to production only after auth, RLS, and browser QA are verified.
