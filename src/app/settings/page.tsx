import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Save, Settings } from "lucide-react";
import { updateProfileAction } from "@/app/actions/settings";
import { SetupNotice } from "@/components/setup-notice";
import { profileFromRow } from "@/lib/change-order-records";
import { defaultBusinessProfile, type PaymentTiming, type Tone } from "@/lib/change-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings"
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const paymentTimings: Array<{ value: PaymentTiming; label: string }> = [
  { value: "deposit-before", label: "Deposit before added work begins" },
  { value: "completion", label: "Due when added work is complete" },
  { value: "next-invoice", label: "Add to next invoice" }
];

const tones: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" }
];

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const message = first(params.message);
  const error = first(params.error);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return <SetupNotice title="Connect Supabase to save settings" />;
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (claimsError || !userId) {
    redirect("/sign-in?next=/settings");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Settings profile query failed.", {
      code: profileError.code,
      message: profileError.message
    });
    throw new Error("The business profile could not be loaded.");
  }

  const profile = profileFromRow(profileRow) ?? {
    ...defaultBusinessProfile,
    contactEmail: typeof data?.claims?.email === "string" ? data.claims.email : ""
  };

  return (
    <section className="tool-shell py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="panel-kicker">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Business defaults
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--ink)] sm:text-5xl">
            Settings
          </h1>
          <p className="mt-3 max-w-[65ch] leading-7 text-[var(--ink-soft)]">
            These defaults prefill saved documents and keep document headers consistent.
          </p>
        </div>

        {message ? (
          <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-3 text-sm font-bold text-[var(--accent-strong)]">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-lg border border-[color:oklch(0.72_0.08_25)] bg-[var(--danger-soft)] p-3 text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <form action={updateProfileAction} className="utility-panel grid gap-5 p-5 sm:p-6">
          <div className="form-section-title">
            <div>
              <p className="panel-kicker">Reusable profile</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                Default job paperwork
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Business name
              <input
                className="field-control"
                name="businessName"
                defaultValue={profile.businessName}
                autoComplete="organization"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Contact email
              <input
                className="field-control"
                name="contactEmail"
                type="email"
                defaultValue={profile.contactEmail}
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Phone
              <input
                className="field-control"
                name="phone"
                defaultValue={profile.phone}
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Default hourly rate
              <input
                className="field-control"
                name="defaultHourlyRate"
                type="number"
                min="0"
                step="1"
                defaultValue={profile.defaultHourlyRate}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Default markup %
              <input
                className="field-control"
                name="defaultMarginPercent"
                type="number"
                min="0"
                max="80"
                step="1"
                defaultValue={profile.defaultMarginPercent}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Default deposit %
              <input
                className="field-control"
                name="defaultDepositPercent"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={profile.defaultDepositPercent}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Default payment timing
              <select
                className="field-control"
                name="defaultPaymentTiming"
                defaultValue={profile.defaultPaymentTiming}
              >
                {paymentTimings.map((timing) => (
                  <option key={timing.value} value={timing.value}>
                    {timing.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Default tone
              <select className="field-control" name="defaultTone" defaultValue={profile.defaultTone}>
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            <Save className="h-5 w-5" aria-hidden="true" />
            Save defaults
          </button>
        </form>
      </div>
    </section>
  );
}
