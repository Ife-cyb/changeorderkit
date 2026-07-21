import { FileText, UserPlus } from "lucide-react";
import Link from "next/link";
import {
  type DeadlineUrgency,
  formatDate,
  formatMoney
} from "@/lib/change-order";

type Props = {
  isSignedIn: boolean;
  documentLabel: string;
  exampleInput: boolean;
  total: number;
  deposit: number;
  depositRequired: boolean;
  currency: string;
  approvalDeadline: string;
  approvalUrgency: DeadlineUrgency;
  approvalDeadlineClass: string;
};

export function DraftSummaryCard({
  isSignedIn,
  documentLabel,
  exampleInput,
  total,
  deposit,
  depositRequired,
  currency,
  approvalDeadline,
  approvalUrgency,
  approvalDeadlineClass
}: Props) {
  return (
    <aside
      className="ledger-rail ledger-rail-supporting no-print overflow-hidden"
      aria-label="Current draft status"
    >
      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent-strong)]">
          {isSignedIn ? "Workspace enabled" : "Browser draft"}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          {isSignedIn
            ? "Saved drafts and business defaults are active."
            : "Autosaves locally. Sign in when this becomes a job record."}
        </p>
      </div>
      <div className="ledger-row">
        <span className="text-sm text-[var(--muted)]">Document type</span>
        <strong className="text-right text-sm text-[var(--ink)]">{documentLabel}</strong>
      </div>
      <div className="ledger-row">
        <span className="text-sm text-[var(--muted)]">Current total</span>
        <div className="flex items-center justify-end gap-2">
          {exampleInput ? (
            <span className="rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-xs font-black uppercase tracking-[0.1em] text-[var(--accent-strong)]">
              Example
            </span>
          ) : null}
          <strong className="font-mono text-sm text-[var(--accent-strong)]">
            {formatMoney(total, currency)}
          </strong>
        </div>
      </div>
      <div className="ledger-row">
        <span className="text-sm text-[var(--muted)]">Deposit</span>
        <strong className="font-mono text-sm text-[var(--accent-strong)]">
          {depositRequired ? formatMoney(deposit, currency) : "Not required"}
        </strong>
      </div>
      <div className="ledger-row">
        <span className="text-sm text-[var(--muted)]">Approval by</span>
        <div className="text-right">
          <strong className={`block font-mono text-sm ${approvalDeadlineClass}`}>
            {formatDate(approvalDeadline)}
          </strong>
          {approvalUrgency !== "normal" ? (
            <span
              className={`mt-1 block text-xs font-black uppercase tracking-[0.1em] ${approvalDeadlineClass}`}
            >
              {approvalUrgency === "overdue" ? "Overdue" : "Due soon"}
            </span>
          ) : null}
        </div>
      </div>
      <div className="border-t border-[var(--border)] p-3">
        {isSignedIn ? (
          <Link className="btn btn-secondary w-full" href="/dashboard">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Dashboard
          </Link>
        ) : (
          <Link className="btn btn-secondary w-full" href="/sign-in?next=/">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            Sign in to save
          </Link>
        )}
      </div>
    </aside>
  );
}
