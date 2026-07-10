import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changeorderkit.com";

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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950"
        >
          Skip to main content
        </a>
        <header className="no-print border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div className="tool-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="ChangeOrderKit home">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                CO
              </span>
              <span>
                <span className="block text-lg font-black leading-none text-slate-950">
                  ChangeOrderKit
                </span>
                <span className="block text-sm text-slate-600">
                  Get extra work approved before you start.
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
              <Link className="hover:text-teal-700" href="/remodeling-change-orders">
                For remodelers
              </Link>
              <Link className="hover:text-teal-700" href="/change-order-template">
                Template
              </Link>
              <Link className="hover:text-teal-700" href="/contractor-change-order-calculator">
                Calculator
              </Link>
              <Link className="hover:text-teal-700" href="/scope-creep-email-generator">
                Scope email
              </Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="no-print mt-12 border-t border-slate-200 bg-white">
          <div className="tool-shell flex flex-col gap-3 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>ChangeOrderKit creates business templates, not legal advice.</p>
            <div className="flex gap-4 font-semibold">
              <Link href="/privacy" className="hover:text-teal-700">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-teal-700">
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
