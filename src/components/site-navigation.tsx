"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

type SiteNavigationProps = {
  isSignedIn: boolean;
  showUpsells: boolean;
};

const resourceLinks = [
  { href: "/remodeling-change-orders", label: "For remodelers" },
  { href: "/change-order-template", label: "Template" },
  { href: "/contractor-change-order-calculator", label: "Calculator" },
  { href: "/scope-creep-email-generator", label: "Scope email" }
] as const;

function AccountLinks({
  isSignedIn,
  onNavigate
}: Pick<SiteNavigationProps, "isSignedIn"> & { onNavigate?: () => void }) {
  return (
    <>
      {isSignedIn ? (
        <>
          <Link className="nav-link" href="/settings" onClick={onNavigate}>
            Settings
          </Link>
          <form action={signOutAction}>
            <button className="nav-link" type="submit">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <Link className="nav-link nav-link-strong" href="/sign-in" onClick={onNavigate}>
          Sign in
        </Link>
      )}
    </>
  );
}

export function SiteNavigation({ isSignedIn, showUpsells }: SiteNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function closeResources() {
    if (resourcesRef.current) {
      resourcesRef.current.open = false;
    }
  }

  return (
    <>
      <nav className="site-nav site-nav-desktop" aria-label="Primary navigation">
        <Link className="nav-link" href="/dashboard">
          Dashboard
        </Link>
        <details
          ref={resourcesRef}
          className="nav-resources"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeResources();
              resourcesRef.current?.querySelector("summary")?.focus();
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              closeResources();
            }
          }}
        >
          <summary className="nav-link">
            Resources
            <ChevronDown className="nav-chevron h-4 w-4" aria-hidden="true" />
          </summary>
          <div className="resource-popover" role="group" aria-label="Resources">
            {resourceLinks.map((link) => (
              <Link key={link.href} className="nav-link" href={link.href} onClick={closeResources}>
                {link.label}
              </Link>
            ))}
          </div>
        </details>
        {showUpsells ? (
          <Link className="nav-link" href="/kit">
            Kit
          </Link>
        ) : null}
        <AccountLinks isSignedIn={isSignedIn} />
      </nav>

      <button
        ref={toggleRef}
        className="mobile-nav-toggle"
        type="button"
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation-panel"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
        <span>Menu</span>
      </button>

      <div
        className={mobileOpen ? "mobile-nav-layer mobile-nav-layer-open" : "mobile-nav-layer"}
        aria-hidden={!mobileOpen}
      >
        <button
          className="mobile-nav-backdrop"
          type="button"
          tabIndex={-1}
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
        <div
          ref={panelRef}
          id="mobile-navigation-panel"
          className="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mobile-nav-heading">
            <p className="panel-kicker">Navigation</p>
            <button
              className="mobile-nav-close"
              type="button"
              aria-label="Close navigation menu"
              onClick={() => {
                closeMobileMenu();
                toggleRef.current?.focus();
              }}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav className="mobile-site-nav" aria-label="Primary navigation">
            <Link className="nav-link" href="/dashboard" onClick={closeMobileMenu}>
              Dashboard
            </Link>
            <div className="mobile-resource-group">
              <p className="mobile-nav-label">Resources</p>
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  className="nav-link"
                  href={link.href}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {showUpsells ? (
              <Link className="nav-link" href="/kit" onClick={closeMobileMenu}>
                Kit
              </Link>
            ) : null}
            <AccountLinks isSignedIn={isSignedIn} onNavigate={closeMobileMenu} />
          </nav>
        </div>
      </div>
    </>
  );
}
