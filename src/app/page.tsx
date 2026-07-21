import type { Metadata } from "next";
import { ChangeOrderGenerator } from "@/components/change-order-generator";
import { LandingPage } from "@/components/landing-page";
import { profileFromRow } from "@/lib/change-order-records";
import { createDefaultInput } from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Price extra work before it starts",
  description:
    "Build a clear price, written approval request, deposit schedule, and client-ready change order before additional work begins.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Price extra work before it starts",
    description:
      "Turn an added client request into a clear price, approval message, and client-ready record in minutes.",
    type: "website",
    url: "/"
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ChangeOrderKit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description:
    "A browser-based change order generator for pricing added work, setting approval terms, and producing a client-ready record.",
  featureList: [
    "Change order pricing",
    "Written approval language",
    "Deposit calculation",
    "Client email generation",
    "Print and PDF output"
  ]
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  let isSignedIn = false;
  let profile = null;

  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

    if (userId) {
      isSignedIn = true;
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      profile = profileFromRow(profileRow);
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <LandingPage />
      <ChangeOrderGenerator
        initialInput={createDefaultInput(profile ?? undefined)}
        isSignedIn={isSignedIn}
        businessProfile={profile}
        showUpsells={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
        pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
        templateKitLink={process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK}
        headingLevel="h2"
      />
    </>
  );
}
