import { notFound, redirect } from "next/navigation";
import { ChangeOrderGenerator } from "@/components/change-order-generator";
import { SetupNotice } from "@/components/setup-notice";
import { changeOrderFromRow, profileFromRow } from "@/lib/change-order-records";
import { createDefaultInput } from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

export default async function SavedChangeOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return <SetupNotice title="Connect Supabase to save change orders" />;
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (claimsError || !userId) {
    redirect(`/sign-in?next=${encodeURIComponent(`/dashboard/change-orders/${id}`)}`);
  }

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = profileFromRow(profileRow);

  if (id === "new") {
    return (
      <ChangeOrderGenerator
        initialInput={createDefaultInput(profile ?? undefined)}
        isSignedIn
        businessProfile={profile}
        useLocalDraft={false}
        paymentLink={process.env.NEXT_PUBLIC_PAYMENT_LINK}
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
      paymentLink={process.env.NEXT_PUBLIC_PAYMENT_LINK}
      templateKitLink={process.env.NEXT_PUBLIC_TEMPLATE_KIT_LINK}
    />
  );
}
