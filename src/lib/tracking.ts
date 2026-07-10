import { track } from "@vercel/analytics";
import type { FunnelEventName } from "@/lib/funnel";

type TrackProperty = string | number | boolean | null | undefined;

export function trackEvent(
  name: FunnelEventName,
  properties?: Record<string, TrackProperty>
) {
  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt the core generator flow.
  }
}
