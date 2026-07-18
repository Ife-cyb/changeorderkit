import { AlertTriangle } from "lucide-react";
import { type ValidationErrors } from "@/lib/change-order";

export type NumericField =
  | "laborHours"
  | "hourlyRate"
  | "materialsCost"
  | "marginPercent"
  | "rushPercent"
  | "depositPercent";

type Props = {
  errors: ValidationErrors;
  numberFieldValue: (field: NumericField) => string;
  setNumberField: (field: NumericField, value: string) => void;
  normalizeNumberField: (field: NumericField) => void;
};

function InputError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-[var(--danger)]" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function IntakePricingFields({
  errors,
  numberFieldValue,
  setNumberField,
  normalizeNumberField
}: Props) {
  return (
    <div className="mt-8 border-t border-[var(--border)] pt-7">
      <div className="mb-5">
        <p className="panel-kicker">Pricing math</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Calculate the added cost separately from the scope and contact record above.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Extra labor hours
          <input
            className="field-control"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={numberFieldValue("laborHours")}
            aria-invalid={Boolean(errors.laborHours)}
            aria-describedby={errors.laborHours ? "laborHours-error" : undefined}
            onChange={(event) => setNumberField("laborHours", event.target.value)}
            onBlur={() => normalizeNumberField("laborHours")}
          />
          <InputError id="laborHours-error" message={errors.laborHours} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Hourly rate
          <input
            className="field-control"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("hourlyRate")}
            aria-invalid={Boolean(errors.hourlyRate)}
            aria-describedby={errors.hourlyRate ? "hourlyRate-error" : undefined}
            onChange={(event) => setNumberField("hourlyRate", event.target.value)}
            onBlur={() => normalizeNumberField("hourlyRate")}
          />
          <InputError id="hourlyRate-error" message={errors.hourlyRate} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Materials cost
          <input
            className="field-control"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("materialsCost")}
            aria-invalid={Boolean(errors.materialsCost)}
            aria-describedby={errors.materialsCost ? "materialsCost-error" : undefined}
            onChange={(event) => setNumberField("materialsCost", event.target.value)}
            onBlur={() => normalizeNumberField("materialsCost")}
          />
          <InputError id="materialsCost-error" message={errors.materialsCost} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Markup + overhead allowance %
          <input
            className="field-control"
            type="number"
            min="0"
            max="80"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("marginPercent")}
            aria-invalid={Boolean(errors.marginPercent)}
            aria-describedby={
              errors.marginPercent ? "marginPercent-help marginPercent-error" : "marginPercent-help"
            }
            onChange={(event) => setNumberField("marginPercent", event.target.value)}
            onBlur={() => normalizeNumberField("marginPercent")}
          />
          <span id="marginPercent-help" className="text-sm font-medium leading-6 text-[var(--muted)]">
            One combined percentage applied to labor and materials and shown as one allowance.
          </span>
          <InputError id="marginPercent-error" message={errors.marginPercent} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Rush + disruption fee %
          <input
            className="field-control"
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("rushPercent")}
            aria-invalid={Boolean(errors.rushPercent)}
            aria-describedby={
              errors.rushPercent ? "rushPercent-help rushPercent-error" : "rushPercent-help"
            }
            onChange={(event) => setNumberField("rushPercent", event.target.value)}
            onBlur={() => normalizeNumberField("rushPercent")}
          />
          <span id="rushPercent-help" className="text-sm font-medium leading-6 text-[var(--muted)]">
            One combined fee for accelerated timing or disruption, itemized as a single line.
          </span>
          <InputError id="rushPercent-error" message={errors.rushPercent} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Deposit %
          <input
            className="field-control"
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("depositPercent")}
            aria-invalid={Boolean(errors.depositPercent)}
            aria-describedby={errors.depositPercent ? "depositPercent-error" : undefined}
            onChange={(event) => setNumberField("depositPercent", event.target.value)}
            onBlur={() => normalizeNumberField("depositPercent")}
          />
          <InputError id="depositPercent-error" message={errors.depositPercent} />
        </label>
      </div>
    </div>
  );
}
