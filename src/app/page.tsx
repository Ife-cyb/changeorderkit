import { ChangeOrderGenerator } from "@/components/change-order-generator";
import { profileFromRow } from "@/lib/change-order-records";
import { createDefaultInput } from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    <ChangeOrderGenerator
      initialInput={createDefaultInput(profile ?? undefined)}
      isSignedIn={isSignedIn}
      businessProfile={profile}
      showUpsells={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
      pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
      templateKitLink={process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK}
    />
  );
}
