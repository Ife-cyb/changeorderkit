import {
  type BusinessProfile,
  type ChangeOrderInput,
  type ChangeOrderStatus,
  type DocumentType,
  type PaymentTiming,
  type SavedChangeOrder,
  type Tone,
  calculatePrice,
  defaultBusinessProfile,
  sanitizeChangeOrderInput
} from "@/lib/change-order";
import type { Database, Json } from "@/lib/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ChangeOrderRow = Database["public"]["Tables"]["change_orders"]["Row"];
export type ChangeOrderInsert = Database["public"]["Tables"]["change_orders"]["Insert"];
export type ChangeOrderUpdate = Database["public"]["Tables"]["change_orders"]["Update"];

type DefaultSettings = {
  defaultHourlyRate?: number;
  defaultMarginPercent?: number;
  defaultDepositPercent?: number;
  defaultPaymentTiming?: PaymentTiming;
  defaultTone?: Tone;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function documentTypeFromRow(value: unknown): DocumentType {
  return value === "work-order" || value === "service-agreement" || value === "change-order"
    ? value
    : "change-order";
}

function numberSetting(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
}

function defaultSettingsFromJson(value: Json): Required<DefaultSettings> {
  const record = isRecord(value) ? value : {};

  return {
    defaultHourlyRate: numberSetting(
      record.defaultHourlyRate,
      defaultBusinessProfile.defaultHourlyRate,
      0,
      100000
    ),
    defaultMarginPercent: numberSetting(
      record.defaultMarginPercent,
      defaultBusinessProfile.defaultMarginPercent,
      0,
      80
    ),
    defaultDepositPercent: numberSetting(
      record.defaultDepositPercent,
      defaultBusinessProfile.defaultDepositPercent,
      0,
      100
    ),
    defaultPaymentTiming:
      record.defaultPaymentTiming === "completion" ||
      record.defaultPaymentTiming === "next-invoice" ||
      record.defaultPaymentTiming === "deposit-before"
        ? record.defaultPaymentTiming
        : defaultBusinessProfile.defaultPaymentTiming,
    defaultTone:
      record.defaultTone === "direct" || record.defaultTone === "formal" || record.defaultTone === "friendly"
        ? record.defaultTone
        : defaultBusinessProfile.defaultTone
  };
}

export function profileToDefaultSettings(profile: BusinessProfile): Json {
  return {
    defaultHourlyRate: profile.defaultHourlyRate,
    defaultMarginPercent: profile.defaultMarginPercent,
    defaultDepositPercent: profile.defaultDepositPercent,
    defaultPaymentTiming: profile.defaultPaymentTiming,
    defaultTone: profile.defaultTone
  };
}

export function profileFromRow(row: ProfileRow | null | undefined): BusinessProfile | null {
  if (!row) {
    return null;
  }

  const defaults = defaultSettingsFromJson(row.default_settings);

  return {
    id: row.id,
    email: row.email,
    businessName: row.business_name,
    contactEmail: row.contact_email,
    phone: row.phone,
    defaultHourlyRate: defaults.defaultHourlyRate,
    defaultMarginPercent: defaults.defaultMarginPercent,
    defaultDepositPercent: defaults.defaultDepositPercent,
    defaultPaymentTiming: defaults.defaultPaymentTiming,
    defaultTone: defaults.defaultTone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function profileFromFormData(
  formData: FormData,
  userId: string,
  email: string
): ProfileInsert {
  const profile: BusinessProfile = {
    businessName: String(formData.get("businessName") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    defaultHourlyRate: Number.parseFloat(String(formData.get("defaultHourlyRate") ?? "")),
    defaultMarginPercent: Number.parseFloat(String(formData.get("defaultMarginPercent") ?? "")),
    defaultDepositPercent: Number.parseFloat(String(formData.get("defaultDepositPercent") ?? "")),
    defaultPaymentTiming: String(formData.get("defaultPaymentTiming")) as PaymentTiming,
    defaultTone: String(formData.get("defaultTone")) as Tone
  };

  const settings = defaultSettingsFromJson(profileToDefaultSettings(profile));

  return {
    id: userId,
    email,
    business_name: profile.businessName,
    contact_email: profile.contactEmail,
    phone: profile.phone,
    default_settings: settings,
    updated_at: new Date().toISOString()
  };
}

export function changeOrderFromRow(row: ChangeOrderRow): SavedChangeOrder {
  const rowDocumentType = row.document_type ? documentTypeFromRow(row.document_type) : undefined;
  const input = sanitizeChangeOrderInput(row.input, rowDocumentType);
  const documentType = rowDocumentType ?? input.documentType;

  return {
    id: row.id,
    userId: row.user_id,
    documentType,
    title: row.title,
    clientName: row.client_name,
    projectName: row.project_name,
    status: row.status,
    input,
    total: Number(row.total) || 0,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function buildChangeOrderInsert(
  userId: string,
  input: ChangeOrderInput,
  status: ChangeOrderStatus = "draft"
): ChangeOrderInsert {
  const clean = sanitizeChangeOrderInput(input);
  const breakdown = calculatePrice(clean);
  const now = new Date().toISOString();

  return {
    user_id: userId,
    document_type: clean.documentType,
    title: clean.documentTitle.trim() || clean.project.trim() || "Untitled document",
    client_name: clean.client.trim(),
    project_name: clean.project.trim(),
    status,
    input: clean as unknown as Json,
    total: breakdown.total,
    currency: clean.currency,
    updated_at: now
  };
}

export function buildChangeOrderUpdate(input: ChangeOrderInput): ChangeOrderUpdate {
  const insert = buildChangeOrderInsert("placeholder", input);

  return {
    document_type: insert.document_type,
    title: insert.title,
    client_name: insert.client_name,
    project_name: insert.project_name,
    input: insert.input,
    total: insert.total,
    currency: insert.currency,
    updated_at: insert.updated_at
  };
}
