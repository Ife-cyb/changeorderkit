import { AlertTriangle } from "lucide-react";
import type { NumericField } from "@/components/generator/intake-pricing-fields";
import {
  type ChangeOrderInput,
  formatMoney,
  type PaymentTiming,
  type Tone,
  type ValidationErrors
} from "@/lib/change-order";

const tones: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" }
];

const paymentTimings: Array<{ value: PaymentTiming; label: string }> = [
  { value: "deposit-before", label: "Deposit before work begins" },
  { value: "completion", label: "Due when work is complete" },
  { value: "next-invoice", label: "Add to next invoice" }
];

type Props = {
  input: ChangeOrderInput;
  depositAmount: number;
  errors: ValidationErrors;
  setTextField: (field: keyof ChangeOrderInput, value: string) => void;
  numberFieldValue: (field: NumericField) => string;
  setNumberField: (field: NumericField, value: string) => void;
  normalizeNumberField: (field: NumericField) => void;
  registerFirstError: (
    field: keyof ChangeOrderInput,
    node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  ) => void;
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
export function IntakeTermsFields({
  input,
  depositAmount,
  errors,
  setTextField,
  numberFieldValue,
  setNumberField,
  normalizeNumberField,
  registerFirstError
}: Props) {
  const depositApplies = input.paymentTiming === "deposit-before";
  const depositError = depositApplies ? errors.depositPercent : undefined;

  return (
    <div className="guided-fields grid gap-4 md:grid-cols-2">
      <label className="field-label md:col-span-2">
        Payment timing
        <select
          className="field-control"
          value={input.paymentTiming}
          onChange={(event) => setTextField("paymentTiming", event.target.value as PaymentTiming)}
        >
          {paymentTimings.map((timing) => (
            <option key={timing.value} value={timing.value}>
              {timing.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Deposit %
        <input
          className="field-control"
          type="number"
          min="0"
          max="100"
          step="1"
          inputMode="decimal"
          value={numberFieldValue("depositPercent")}
          disabled={!depositApplies}
          aria-invalid={Boolean(depositError)}
          aria-describedby={depositError ? "deposit-help depositPercent-error" : "deposit-help"}
          ref={(node) => registerFirstError("depositPercent", node)}
          onChange={(event) => setNumberField("depositPercent", event.target.value)}
          onBlur={() => normalizeNumberField("depositPercent")}
        />
        <span id="deposit-help" className="field-help">
          {depositApplies
            ? `${formatMoney(depositAmount, input.currency)} due before work`
            : "No deposit is applied with this payment timing."}
        </span>
        <InputError id="depositPercent-error" message={depositError} />
      </label>

      <label className="field-label">
        Approval deadline
        <input
          className="field-control"
          type="date"
          value={input.approvalDeadline}
          onChange={(event) => setTextField("approvalDeadline", event.target.value)}
        />
      </label>

      <label className="field-label md:col-span-2">
        Client email tone
        <select
          className="field-control"
          value={input.tone}
          onChange={(event) => setTextField("tone", event.target.value as Tone)}
        >
          {tones.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {tone.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
