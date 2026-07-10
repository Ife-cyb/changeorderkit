# ChangeOrderKit

ChangeOrderKit is a small, static-first MVP that helps contractors and service providers turn client scope changes into priced, approved work before they start extra work.

## Features

- Change order calculator
- Deterministic client email and approval text
- Scope-protection checklist
- Copy, text download, and print/save-as-PDF flow
- Draft autosave in the browser
- Configurable paid-pilot link through `NEXT_PUBLIC_PILOT_LINK`
- Privacy-conscious funnel events through Vercel Analytics
- Remodeling-specific validation landing page
- SEO pages for template and calculator searches

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_PILOT_LINK`: optional external application or checkout URL for the paid approval-link pilot.
- `NEXT_PUBLIC_SITE_URL`: optional canonical site URL.

For backwards compatibility, the home page still reads `NEXT_PUBLIC_PAYMENT_LINK` when the new
pilot variable is absent. The app never treats an external redirect as verified payment or an
unlocked entitlement.

## Verification

```bash
npm run check
```

This runs TypeScript, ESLint, tests, and a production build.

## Deployment

The Vercel project is connected to this GitHub repository. Pushes to `main` trigger
automatic Vercel deployments.
