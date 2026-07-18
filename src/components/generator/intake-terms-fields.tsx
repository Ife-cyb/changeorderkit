import {
  type ChangeOrderInput,
  type PaymentTiming,
  type Tone
} from "@/lib/change-order";

const tones: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" }
];

const paymentTimings: Array<{ value: PaymentTiming; label: string }> = [
  { value: "deposit-before", label: "Deposit before added work begins" },
  { value: "completion", label: "Due when added work is complete" },
  { value: "next-invoice", label: "Add to next invoice" }
];

const currencies = [
  { value: "USD", label: "USD — US dollar" },
  { value: "CAD", label: "CAD — Canadian dollar" },
  { value: "GBP", label: "GBP — British pound" },
  { value: "AUD", label: "AUD — Australian dollar" },
  { value: "NGN", label: "NGN — Nigerian naira" }
] as const;

type Props = {
  input: ChangeOrderInput;
  setTextField: (field: keyof ChangeOrderInput, value: string) => void;
};

export function IntakeTermsFields({ input, setTextField }: Props) {
  return (
    <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-4">
      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
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

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Approval deadline
        <input
          className="field-control"
          type="date"
          value={input.approvalDeadline}
          onChange={(event) => setTextField("approvalDeadline", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Email tone
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

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
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
    </div>
  );
}
