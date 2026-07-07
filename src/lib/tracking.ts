import { track } from "@vercel/analytics";

type TrackProperty = string | number | boolean | null | undefined;

export function trackEvent(name: string, properties?: Record<string, TrackProperty>) {
  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt the core generator flow.
  }
}
