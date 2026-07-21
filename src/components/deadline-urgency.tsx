"use client";

import { useSyncExternalStore } from "react";
import {
  deadlineUrgency,
  formatDate,
  type DeadlineUrgency
} from "@/lib/change-order";

const localDayListeners = new Set<() => void>();
let localDayTimer: ReturnType<typeof setInterval> | null = null;

function currentLocalDay() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function subscribeToLocalDay(listener: () => void) {
  localDayListeners.add(listener);

  if (localDayTimer === null) {
    localDayTimer = setInterval(() => {
      localDayListeners.forEach((notify) => notify());
    }, 60_000);
  }

  return () => {
    localDayListeners.delete(listener);

    if (localDayListeners.size === 0 && localDayTimer !== null) {
      clearInterval(localDayTimer);
      localDayTimer = null;
    }
  };
}

function serverDaySnapshot() {
  return "";
}

export function useDeadlineUrgency(dateString: string): DeadlineUrgency {
  const localDay = useSyncExternalStore(
    subscribeToLocalDay,
    currentLocalDay,
    serverDaySnapshot
  );

  return localDay
    ? deadlineUrgency(dateString, new Date(`${localDay}T12:00:00`))
    : "normal";
}

export function ApprovalDeadlineIndicator({ value }: { value: string }) {
  const urgency = useDeadlineUrgency(value);
  const urgencyClass =
    urgency === "overdue"
      ? "text-[var(--danger)]"
      : urgency === "soon"
        ? "text-[var(--warning)]"
        : "text-[var(--muted)]";

  return (
    <span className={`text-sm font-semibold ${urgencyClass}`}>
      Approval {formatDate(value)}
      {urgency === "overdue" ? " · Overdue" : urgency === "soon" ? " · Due soon" : ""}
    </span>
  );
}
