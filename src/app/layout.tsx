import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changeorderkit.com";

const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap"
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ChangeOrderKit - Price and approve extra work",
    template: "%s | ChangeOrderKit"
  },
  description:
    "Generate change orders, approval emails, and payment terms before client scope changes become unpaid work.",
  openGraph: {
    title: "ChangeOrderKit",
    description:
      "Price extra work, set approval terms, and generate the client message before you start.",
    url: siteUrl,
    siteName: "ChangeOrderKit",
    type: "website"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  let isSignedIn = false;

  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    isSignedIn = typeof data?.claims?.sub === "string";
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--paper)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[var(--ink)]"
        >
          Skip to main content
        </a>
        <header className="app-header no-print">
          <div className="tool-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="brand-lockup" aria-label="ChangeOrderKit home">
              <span className="brand-mark" aria-hidden="true">
                <span>CO</span>
              </span>
              <span>
                <span className="block text-lg font-black leading-none tracking-tight text-[var(--ink)]">
                  ChangeOrderKit
                </span>
                <span className="block text-sm font-medium text-[var(--muted)]">
                  Extra work priced before it starts.
                </span>
              </span>
            </Link>
            <nav className="site-nav" aria-label="Primary navigation">
              <Link className="nav-link" href="/dashboard">
                Dashboard
              </Link>
              <Link className="nav-link" href="/kit">
                Kit
              </Link>
              <Link className="nav-link" href="/change-order-template">
                Template
              </Link>
              <Link className="nav-link" href="/contractor-change-order-calculator">
                Calculator
              </Link>
              <Link className="nav-link" href="/scope-creep-email-generator">
                Scope email
              </Link>
              {isSignedIn ? (
                <>
                  <Link className="nav-link" href="/settings">
                    Settings
                  </Link>
                  <form action={signOutAction}>
                    <button className="nav-link" type="submit">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link className="nav-link nav-link-strong" href="/sign-in">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="app-footer no-print">
          <div className="tool-shell flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[65ch] text-[var(--muted)]">
              ChangeOrderKit creates business templates and math checks, not legal advice.
            </p>
            <div className="flex gap-4 font-bold">
              <Link href="/privacy" className="footer-link">
                Privacy
              </Link>
              <Link href="/terms" className="footer-link">
                Terms
              </Link>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
