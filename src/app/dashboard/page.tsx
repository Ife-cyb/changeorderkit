import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  Copy,
  ExternalLink,
  Filter,
  FilePlus2,
  LayoutDashboard,
  Pencil,
  RotateCcw,
  Trash2
} from "lucide-react";
import {
  archiveChangeOrderFormAction,
  deleteChangeOrderFormAction,
  duplicateChangeOrderFormAction,
  reopenChangeOrderFormAction
} from "@/app/actions/change-orders";
import { AccountPlanSummary } from "@/components/account-plan-summary";
import { ApprovalDeadlineIndicator } from "@/components/deadline-urgency";
import { SetupNotice } from "@/components/setup-notice";
import { changeOrderFromRow, profileFromRow } from "@/lib/change-order-records";
import {
  documentTypeLabel,
  documentTypeOptions,
  formatMoney,
  sanitizeDocumentType,
  type DocumentType,
  type SavedProjectDocument
} from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveAccountEntitlement } from "@/lib/account-entitlements.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard"
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

type SearchParams = Promise<{
  type?: string | string[];
  message?: string | string[];
  error?: string | string[];
}>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatusPill({ status }: { status: SavedProjectDocument["status"] }) {
  const label = status === "archived" ? "Archived" : status === "ready" ? "Ready" : "Draft";

  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--border)] bg-[var(--paper)] px-2.5 text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">
      {label}
    </span>
  );
}

function TypePill({ documentType }: { documentType: DocumentType }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--border)] bg-[var(--paper-soft)] px-2.5 text-xs font-black uppercase tracking-[0.1em] text-[var(--ink-soft)]">
      {documentTypeLabel(documentType)}
    </span>
  );
}

function EmptyState({ archived = false, activeType }: { archived?: boolean; activeType?: DocumentType }) {
  const typeLabel = activeType ? documentTypeLabel(activeType).toLowerCase() : "documents";

  return (
    <div className="workspace-panel p-5">
      <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">
        {archived ? `No archived ${typeLabel}` : `No saved ${typeLabel} yet`}
      </h2>
      <p className="mt-2 max-w-[65ch] leading-7 text-[var(--ink-soft)]">
        {archived
          ? "Archived work will appear here when you move old drafts out of the active list."
          : "Create a saved draft from the dashboard or save the visitor generator after signing in."}
      </p>
      {!archived ? (
        <Link
          className="btn btn-primary mt-4 w-full sm:w-auto"
          href={`/dashboard/documents/new${activeType ? `?type=${activeType}` : ""}`}
        >
          <FilePlus2 className="h-5 w-5" aria-hidden="true" />
          New document
        </Link>
      ) : null}
    </div>
  );
}

function DocumentList({
  orders,
  canCreateDocument
}: {
  orders: SavedProjectDocument[];
  canCreateDocument: boolean;
}) {
  return (
    <div className="workspace-panel px-4 sm:px-5">
      {orders.map((order) => (
        <article key={order.id} className="workspace-row">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={order.status} />
                <TypePill documentType={order.documentType} />
                <span className="text-sm font-semibold text-[var(--muted)]">
                  Updated {formatUpdatedAt(order.updatedAt)}
                </span>
                {order.input.approvalDeadline ? (
                  <ApprovalDeadlineIndicator value={order.input.approvalDeadline} />
                ) : null}
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--ink)]">
                {order.title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                {order.clientName || "No client"} - {order.projectName || "No project"}
              </p>
              <p className="mt-3 font-mono text-2xl font-black text-[var(--ink)]">
                {formatMoney(order.total, order.currency)}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-96 lg:grid-cols-3">
              <Link className="btn btn-primary" href={`/dashboard/documents/${order.id}`}>
                <Pencil className="h-5 w-5" aria-hidden="true" />
                Edit
              </Link>
              {canCreateDocument ? (
                <form action={duplicateChangeOrderFormAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-secondary w-full" type="submit">
                    <Copy className="h-5 w-5" aria-hidden="true" />
                    Duplicate
                  </button>
                </form>
              ) : (
                <button
                  className="btn btn-disabled w-full"
                  type="button"
                  disabled
                  aria-describedby="cloud-document-creation-notice"
                >
                  <Copy className="h-5 w-5" aria-hidden="true" />
                  Duplicate unavailable
                </button>
              )}
              {order.status === "archived" ? (
                <form action={reopenChangeOrderFormAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-secondary w-full" type="submit">
                    <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    Reopen
                  </button>
                </form>
              ) : (
                <form action={archiveChangeOrderFormAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-secondary w-full" type="submit">
                    <Archive className="h-5 w-5" aria-hidden="true" />
                    Archive
                  </button>
                </form>
              )}
              <form action={deleteChangeOrderFormAction}>
                <input type="hidden" name="id" value={order.id} />
                <button className="btn btn-secondary w-full" type="submit">
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                  Delete
                </button>
              </form>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function typeFilterHref(type?: DocumentType) {
  return type ? `/dashboard?type=${type}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = first(params.type);
  const message = first(params.message);
  const mutationError = first(params.error);
  const activeType = type ? sanitizeDocumentType(type) : null;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return <SetupNotice title="Connect Supabase to use the dashboard" />;
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (claimsError || !userId) {
    redirect("/sign-in?next=/dashboard");
  }

  const [
    { data: profileRow, error: profileError },
    { data: orderRows, error: orderError },
    entitlement
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("change_orders").select("*").eq("user_id", userId).order("updated_at", {
      ascending: false
    }),
    resolveAccountEntitlement(supabase, userId)
  ]);

  const profile = profileError ? null : profileFromRow(profileRow);

  if (profileError) {
    console.error("Dashboard profile query failed.", {
      code: profileError.code,
      message: profileError.message
    });
  }

  if (orderError) {
    console.error("Dashboard document query failed.", {
      code: orderError.code,
      message: orderError.message
    });
  }

  const orders = (orderRows ?? []).map(changeOrderFromRow);
  const filteredOrders = activeType
    ? orders.filter((order) => order.documentType === activeType)
    : orders;
  const activeOrders = filteredOrders.filter((order) => order.status !== "archived");
  const archivedOrders = filteredOrders.filter((order) => order.status === "archived");

  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="panel-kicker">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Saved workspace
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--ink)] sm:text-5xl">
            Documents
          </h1>
          <p className="mt-3 max-w-[65ch] leading-7 text-[var(--ink-soft)]">
            {profile?.businessName
              ? `${profile.businessName} defaults are ready for new drafts.`
              : "Save drafts, duplicate repeat jobs, and keep approvals, work orders, and service agreements organized."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="btn btn-secondary" href="/settings">
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
            Settings
          </Link>
          <Link className="btn btn-primary" href="/dashboard/documents/new">
            <FilePlus2 className="h-5 w-5" aria-hidden="true" />
            New document
          </Link>
        </div>
      </div>

      {message ? (
        <p className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-3 text-sm font-bold text-[var(--accent-strong)]">
          {message}
        </p>
      ) : null}

      {mutationError ? (
        <p className="mb-5 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-bold text-[var(--danger)]">
          {mutationError}
        </p>
      ) : null}

      {profileError ? (
        <p className="mb-5 rounded-lg border border-[color:oklch(0.72_0.08_70)] bg-[var(--warning-soft)] p-3 text-sm font-bold text-[var(--warning)]">
          Your business profile could not be loaded. Saved documents are still shown below; retry
          before changing business defaults.
        </p>
      ) : null}

      <AccountPlanSummary
        entitlement={entitlement}
        pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
        showUpgradeLink={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
      />

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Document filters">
        <Link className={!activeType ? "segment segment-active" : "segment"} href={typeFilterHref()}>
          <Filter className="h-4 w-4" aria-hidden="true" />
          All documents
        </Link>
        {documentTypeOptions.map((option) => (
          <Link
            key={option.value}
            className={activeType === option.value ? "segment segment-active" : "segment"}
            href={typeFilterHref(option.value)}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {documentTypeOptions.map((option) => (
          <Link
            key={option.value}
            className="btn btn-secondary justify-start"
            href={`/dashboard/documents/new?type=${option.value}`}
          >
            <FilePlus2 className="h-5 w-5" aria-hidden="true" />
            New {option.label.toLowerCase()}
          </Link>
        ))}
      </div>

      {orderError ? (
        <div className="utility-panel p-5">
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">
            Saved documents could not be loaded.
          </h2>
          <p className="mt-2 leading-7 text-[var(--ink-soft)]">
            No records have been changed. Retry once your connection is stable.
          </p>
          <Link className="btn btn-primary mt-4" href="/dashboard">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            Try again
          </Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {activeOrders.length > 0 ? (
            <DocumentList
              orders={activeOrders}
              canCreateDocument={entitlement.canCreateDocument}
            />
          ) : (
            <EmptyState activeType={activeType ?? undefined} />
          )}

          <section>
            <h2 className="mb-3 text-xl font-black tracking-tight text-[var(--ink)]">Archived</h2>
            {archivedOrders.length > 0 ? (
              <DocumentList
                orders={archivedOrders}
                canCreateDocument={entitlement.canCreateDocument}
              />
            ) : (
              <EmptyState archived activeType={activeType ?? undefined} />
            )}
          </section>
        </div>
      )}
    </section>
  );
}
