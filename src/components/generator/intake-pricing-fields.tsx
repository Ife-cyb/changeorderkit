import { AlertTriangle, Calculator, ChevronDown } from "lucide-react";
import {
  type ChangeOrderInput,
  formatMoney,
  type ValidationErrors
} from "@/lib/change-order";

export type NumericField =
  | "laborHours"
  | "hourlyRate"
  | "materialsCost"
  | "marginPercent"
  | "rushPercent"
  | "depositPercent";

const currencies = [
  { value: "USD", label: "USD · US dollar" },
  { value: "CAD", label: "CAD · Canadian dollar" },
  { value: "GBP", label: "GBP · British pound" },
  { value: "AUD", label: "AUD · Australian dollar" },
  { value: "NGN", label: "NGN · Nigerian naira" }
] as const;

type Props = {
  input: ChangeOrderInput;
  total: number;
  isChangeOrder: boolean;
  errors: ValidationErrors;
  setTextField: (field: keyof ChangeOrderInput, value: string) => void;
  numberFieldValue: (field: NumericField) => string;
  setNumberField: (field: NumericField, value: string) => void;
  normalizeNumberField: (field: NumericField) => void;
  registerFirstError: (field: keyof ChangeOrderInput, node: HTMLInputElement | null) => void;
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
  input,
  total,
  isChangeOrder,
  errors,
  setTextField,
  numberFieldValue,
  setNumberField,
  normalizeNumberField,
  registerFirstError
}: Props) {
  const hasAdjustmentErrors = Boolean(errors.marginPercent || errors.rushPercent);

  return (
    <>
      <div className="guided-fields pricing-fields grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Currency
          <select
            className="field-control"
            value={input.currency}
            onChange={(event) => setTextField("currency", event.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          {isChangeOrder ? "Extra labor hours" : "Labor hours"}
          <input
            className="field-control"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={numberFieldValue("laborHours")}
            aria-invalid={Boolean(errors.laborHours)}
            aria-describedby={errors.laborHours ? "laborHours-error" : undefined}
            ref={(node) => registerFirstError("laborHours", node)}
            onChange={(event) => setNumberField("laborHours", event.target.value)}
            onBlur={() => normalizeNumberField("laborHours")}
          />
          <InputError id="laborHours-error" message={errors.laborHours} />
        </label>

        <label className="field-label">
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
            ref={(node) => registerFirstError("hourlyRate", node)}
            onChange={(event) => setNumberField("hourlyRate", event.target.value)}
            onBlur={() => normalizeNumberField("hourlyRate")}
          />
          <InputError id="hourlyRate-error" message={errors.hourlyRate} />
        </label>

        <label className="field-label">
          Materials and direct costs
          <input
            className="field-control"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={numberFieldValue("materialsCost")}
            aria-invalid={Boolean(errors.materialsCost)}
            aria-describedby={errors.materialsCost ? "materialsCost-error" : undefined}
            ref={(node) => registerFirstError("materialsCost", node)}
            onChange={(event) => setNumberField("materialsCost", event.target.value)}
            onBlur={() => normalizeNumberField("materialsCost")}
          />
          <InputError id="materialsCost-error" message={errors.materialsCost} />
        </label>
      </div>

      <div className="pricing-live-strip" aria-live="polite">
        <div>
          <Calculator className="h-5 w-5" aria-hidden="true" />
          <span>
            <small>Labor + costs + adjustments</small>
            <strong>Client total</strong>
          </span>
        </div>
        <strong>{formatMoney(total, input.currency)}</strong>
      </div>

      <details
        className="optional-disclosure"
        ref={(node) => {
          if (node && hasAdjustmentErrors) {
            node.open = true;
          }
        }}
        onToggle={(event) => {
          if (hasAdjustmentErrors && !event.currentTarget.open) {
            event.currentTarget.open = true;
          }
        }}
      >
        <summary>
          <span>
            Adjust margin or rush pricing
            <small>Use only when the job calls for it</small>
          </span>
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </summary>
        <div className="optional-disclosure-body grid gap-4 md:grid-cols-2">
          <label className="field-label">
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
              aria-describedby="marginPercent-help marginPercent-error"
              ref={(node) => registerFirstError("marginPercent", node)}
              onChange={(event) => setNumberField("marginPercent", event.target.value)}
              onBlur={() => normalizeNumberField("marginPercent")}
            />
            <span id="marginPercent-help" className="field-help">
              One combined percentage applied to labor and materials.
            </span>
            <InputError id="marginPercent-error" message={errors.marginPercent} />
          </label>

          <label className="field-label">
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
              aria-describedby="rushPercent-help rushPercent-error"
              ref={(node) => registerFirstError("rushPercent", node)}
              onChange={(event) => setNumberField("rushPercent", event.target.value)}
              onBlur={() => normalizeNumberField("rushPercent")}
            />
            <span id="rushPercent-help" className="field-help">
              Use for accelerated timing or disruption.
            </span>
            <InputError id="rushPercent-error" message={errors.rushPercent} />
          </label>
        </div>
      </details>
    </>
  );
}
