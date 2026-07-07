# ChangeOrderKit

ChangeOrderKit is a small, static-first MVP that helps contractors and service providers turn client scope changes into priced, approved work before they start extra work.

## Features

- Change order calculator
- Deterministic client email and approval text
- Scope-protection checklist
- Copy, text download, and print/save-as-PDF flow
- Draft autosave in the browser
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
- `NEXT_PUBLIC_SITE_URL`: optional canonical site URL.

The app works without a payment link and shows a clear fallback message.

## Verification

```bash
npm run check
```

This runs TypeScript, ESLint, tests, and a production build.

## Deployment

The Vercel project is connected to this GitHub repository. Pushes to `main` trigger
automatic Vercel deployments.
