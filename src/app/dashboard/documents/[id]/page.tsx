import { notFound, redirect } from "next/navigation";
import { ChangeOrderGenerator } from "@/components/change-order-generator";
import { SetupNotice } from "@/components/setup-notice";
import { changeOrderFromRow, profileFromRow } from "@/lib/change-order-records";
import { createDefaultInput, sanitizeDocumentType } from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  type?: string;
}>;

export default async function SavedDocumentPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return <SetupNotice title="Connect Supabase to save documents" />;
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (claimsError || !userId) {
    redirect(`/sign-in?next=${encodeURIComponent(`/dashboard/documents/${id}`)}`);
  }

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = profileFromRow(profileRow);

  if (id === "new") {
    const documentType = sanitizeDocumentType(type);

    return (
      <ChangeOrderGenerator
        initialInput={createDefaultInput(profile ?? undefined, documentType)}
        isSignedIn
        businessProfile={profile}
        useLocalDraft={false}
        showUpsells={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
        pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
        templateKitLink={process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK}
      />
    );
  }

  const { data: orderRow } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!orderRow) {
    notFound();
  }

  const order = changeOrderFromRow(orderRow);

  return (
    <ChangeOrderGenerator
      initialInput={order.input}
      savedOrderId={order.id}
      isSignedIn
      businessProfile={profile}
      useLocalDraft={false}
      showUpsells={process.env.NEXT_PUBLIC_SHOW_UPSELLS === "true"}
      pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
      templateKitLink={process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK}
    />
  );
}
