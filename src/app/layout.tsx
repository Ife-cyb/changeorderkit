import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import Link from "next/link";
import { SiteNavigation } from "@/components/site-navigation";
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
    "Generate change orders, work orders, service agreement starters, approval emails, and payment terms before job paperwork slows you down.",
  openGraph: {
    title: "ChangeOrderKit",
    description:
      "Price job paperwork, set approval terms, and generate the client message before work starts.",
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
          <div className="tool-shell flex items-center justify-between gap-4 py-4">
            <Link href="/" className="brand-lockup" aria-label="ChangeOrderKit home">
              <span className="brand-mark" aria-hidden="true">
                <span>CO</span>
              </span>
              <span>
                <span className="block text-lg font-black leading-none tracking-tight text-[var(--ink)]">
                  ChangeOrderKit
                </span>
                <span className="block text-sm font-medium text-[var(--muted)]">
                  Job paperwork before work starts.
                </span>
              </span>
            </Link>
            <SiteNavigation
              isSignedIn={isSignedIn}
              showUpsells={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
            />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="app-footer no-print">
          <div className="tool-shell app-footer-grid">
            <div className="app-footer-brand">
              <Link href="/" className="text-lg font-black tracking-tight text-[var(--ink)]">
                ChangeOrderKit
              </Link>
              <p>Price extra work, write the approval request, and keep the project record clear.</p>
            </div>
            <nav aria-label="Product links">
              <p className="app-footer-heading">Product</p>
              <Link href="/#generator" className="footer-link">
                Create a document
              </Link>
              <Link href="/dashboard" className="footer-link">
                Dashboard
              </Link>
              {isSignedIn ? (
                <Link href="/settings" className="footer-link">
                  Settings
                </Link>
              ) : (
                <Link href="/sign-in" className="footer-link">
                  Sign in
                </Link>
              )}
            </nav>
            <nav aria-label="Resource links">
              <p className="app-footer-heading">Resources</p>
              <Link href="/remodeling-change-orders" className="footer-link">
                For remodelers
              </Link>
              <Link href="/change-order-template" className="footer-link">
                Change order template
              </Link>
              <Link href="/scope-creep-email-generator" className="footer-link">
                Scope email
              </Link>
            </nav>
            <nav aria-label="Legal links">
              <p className="app-footer-heading">Legal</p>
              <Link href="/privacy" className="footer-link">
                Privacy
              </Link>
              <Link href="/terms" className="footer-link">
                Terms
              </Link>
            </nav>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
