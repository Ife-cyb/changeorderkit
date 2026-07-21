"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { FunnelEventName } from "@/lib/funnel";
import { trackEvent } from "@/lib/tracking";

type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  eventName: FunnelEventName;
  eventProperties?: Record<string, string | number | boolean | null | undefined>;
  target?: "_blank";
  rel?: string;
};

export function TrackedLink({
  href,
  children,
  className,
  eventName,
  eventProperties,
  target,
  rel
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackEvent(eventName, eventProperties)}
    >
      {children}
    </Link>
  );
}
