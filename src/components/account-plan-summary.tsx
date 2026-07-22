import { Cloud, ExternalLink } from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";
import type { AccountEntitlement } from "@/lib/account-entitlements";
import { getPilotState } from "@/lib/change-order";
import { funnelEvents } from "@/lib/funnel";

type AccountPlanSummaryProps = {
  entitlement: AccountEntitlement;
  pilotLink?: string;
  showUpgradeLink?: boolean;
};

function formatPeriodEnd(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function AccountPlanSummary({
  entitlement,
  pilotLink,
  showUpgradeLink = false
}: AccountPlanSummaryProps) {
  const pilotState = getPilotState(pilotLink);
  const isPro = entitlement.hasProAccess;
  const limitReached = !isPro && !entitlement.canCreateDocument;
  const showConfiguredUpgrade = !isPro && showUpgradeLink && pilotState.configured;
  const periodEnding =
    isPro &&
    entitlement.currentPeriodEnd &&
    (entitlement.cancelAtPeriodEnd || entitlement.subscriptionStatus === "cancelled");

  return (
    <section className="workspace-panel mb-6 px-4 sm:px-5" aria-labelledby="account-plan-title">
      <div className="workspace-row grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="panel-kicker">
            <Cloud className="h-4 w-4" aria-hidden="true" />
            Account plan
          </p>
          <h2 id="account-plan-title" className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">
            {isPro ? "Pro" : "Free plan"}
          </h2>
          <p className="mt-2 font-mono text-lg font-black text-[var(--ink)]">
            {isPro
              ? "Unlimited saved documents"
              : `${entitlement.savedDocumentCount} of 3 saved documents`}
          </p>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-[var(--ink-soft)]">
            {isPro
              ? periodEnding
                ? `Pro access continues through ${formatPeriodEnd(entitlement.currentPeriodEnd!)}.`
                : "Your current Pro access includes unlimited cloud-saved documents."
              : "The calculator, document generation, copy, text download, and Print/PDF remain free."}
          </p>
        </div>

        {!isPro ? (
          showConfiguredUpgrade ? (
            <TrackedLink
              className="btn btn-secondary w-full lg:w-auto"
              href={pilotState.href}
              eventName={funnelEvents.pilotCtaClicked}
              eventProperties={{ source: "dashboard_plan" }}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
              Ask about Pro access
            </TrackedLink>
          ) : (
            <p className="text-sm font-bold text-[var(--muted)]">
              Pro subscriptions are opening soon.
            </p>
          )
        ) : null}
      </div>

      {limitReached ? (
        <div id="free-document-limit-notice" className="workspace-row" role="status">
          <strong className="block text-sm font-black text-[var(--ink)]">
            Free cloud-save limit reached.
          </strong>
          <p className="mt-1 max-w-[75ch] text-sm leading-6 text-[var(--ink-soft)]">
            Your existing documents remain available. Delete one to free a slot, or keep creating,
            copying, downloading, and printing without another cloud save.
          </p>
        </div>
      ) : null}
    </section>
  );
}
