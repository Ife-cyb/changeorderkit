# Design

> Auto-generated and maintained by frontend-god-mode.
> Source of truth for typography, color, motion, layout, and component tokens.
> Read this BEFORE touching the UI in any subsequent session.

## Aesthetic Direction

Industrial premium workspace: a contractor's approval desk with paper-like surfaces, dark ledger rails, precise math, and restrained emerald accents.

## Dials

- DESIGN_VARIANCE: 8 / 10
- MOTION_INTENSITY: 6 / 10
- VISUAL_DENSITY: 4 / 10

## Type Stack

- Display: Geist
- Body: Geist
- Mono: Geist Mono
- Loaded via: `next/font/local` from bundled Next.js Geist assets
- Optical features enabled: `font-feature-settings: "ss01", "cv11", "tnum"`

Banned in this project: Inter, Roboto, Arial, system-ui as primary UI fonts, serif dashboard typography.

## Color Tokens

```css
:root {
  --bg: oklch(0.965 0.01 115);
  --paper: oklch(0.992 0.006 110);
  --paper-soft: oklch(0.955 0.012 115);
  --ink: oklch(0.17 0.018 145);
  --ink-soft: oklch(0.31 0.018 145);
  --muted: oklch(0.46 0.018 145);
  --border: oklch(0.82 0.018 115);
  --accent: oklch(0.5 0.13 155);
  --danger: oklch(0.53 0.16 25);
  --warning: oklch(0.57 0.12 62);
}
```

Banned in this project:
- Purple-to-blue gradients
- Pure black or pure white as primary surfaces
- More than one dominant accent
- Brown/orange-dominant contractor cliches

## Shadows

```css
--shadow-ledge: 0 1px 0 oklch(1 0 0 / 0.72) inset,
  0 18px 56px -34px oklch(0.25 0.04 130 / 0.38);
--shadow-press: 0 1px 0 oklch(1 0 0 / 0.65) inset,
  0 10px 32px -22px oklch(0.25 0.04 130 / 0.3);
```

Shadows are tinted toward the green-neutral background. No pure-black drop shadows.

## Motion

- CSS transition fallback: `cubic-bezier(0.16, 1, 0.3, 1)`
- Button tactile state: translate down 1px and scale to 0.99
- Reduced motion: global `prefers-reduced-motion` disables animation/transition duration
- Banned: bounce/elastic easing, animating width/height, custom cursors

## Layout

- Container: `width: min(1400px, calc(100% - 32px)); margin: 0 auto`
- Reading width: `max-w-[65ch]`
- Hero pattern: left-aligned tool intro with dark live ledger rail; never centered-only
- Dashboard pattern: divided rows inside one workspace panel, not repeated generic cards
- SEO pages: article intro plus divided workflow rows, not three equal feature cards
- Mobile: single-column grids below `md`, 44px minimum controls

## Component Inventory

- `utility-panel`: primary paper surface
- `workspace-panel` and `workspace-row`: dashboard and article row grouping
- `ledger-rail` and `ledger-row`: dark approval/money/status rail
- `btn`, `btn-primary`, `btn-secondary`, `btn-disabled`
- `field-control`
- `segment` and `segment-active`
- `print-document`

## Project-Specific Bans

- No generic "three cards in a row" feature sections
- No centered-only homepage hero
- No "Acme", "John Doe", or round-number fake stats
- No emojis
- No `h-screen`; use `min-height: 100dvh` where full height is needed

## Brand Voice

- Tone: direct, practical, paperwork-aware, calm under client pressure
- Banned: elevate, seamless, unleash, next-gen, game-changing
- Button labels: specific verbs such as "Save defaults", "New change order", "Print / PDF"

## Accessibility Floor

- WCAG 2.2 AA contrast for body copy
- Focus-visible rings on every interactive element
- Real labels for every form input
- Touch targets at least 44px
- `prefers-reduced-motion` respected

## Last Updated

2026-07-08 by frontend-god-mode redesign: established industrial premium workspace tokens, ledger rail pattern, dashboard rows, auth redesign, and SEO/support page system.
