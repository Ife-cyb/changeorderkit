export const funnelEvents = {
  generatorViewed: "generator_viewed",
  formStarted: "form_started",
  validationFailed: "validation_failed",
  changeOrderGenerated: "change_order_generated",
  changeOrderCopied: "change_order_copied",
  changeOrderDownloaded: "change_order_downloaded",
  changeOrderPrinted: "change_order_printed",
  draftReset: "draft_reset",
  pilotCtaClicked: "pilot_cta_clicked",
  pilotLinkMissing: "pilot_link_missing",
  remodelingLandingCtaClicked: "remodeling_landing_cta_clicked"
} as const;

export type FunnelEventName = (typeof funnelEvents)[keyof typeof funnelEvents];

export function totalBucket(total: number) {
  if (!Number.isFinite(total) || total <= 0) {
    return "0";
  }

  if (total < 500) {
    return "1-499";
  }

  if (total < 2_000) {
    return "500-1999";
  }

  if (total < 5_000) {
    return "2000-4999";
  }

  return "5000+";
}
