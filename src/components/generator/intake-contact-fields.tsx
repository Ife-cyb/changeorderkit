import { AlertTriangle } from "lucide-react";
import {
  type ChangeOrderInput,
  type Industry,
  type ValidationErrors
} from "@/lib/change-order";

const industries: Array<{ value: Industry; label: string }> = [
  { value: "remodeling", label: "Remodeling" },
  { value: "landscaping", label: "Landscaping" },
  { value: "handyman", label: "Handyman" },
  { value: "web-design", label: "Web design" },
  { value: "creative", label: "Creative services" },
  { value: "consulting", label: "Consulting" }
];

type FieldNode = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

type Props = {
  input: ChangeOrderInput;
  errors: ValidationErrors;
  isChangeOrder: boolean;
  setTextField: (field: keyof ChangeOrderInput, value: string) => void;
  registerFirstError: (field: keyof ChangeOrderInput, node: FieldNode) => void;
  setFirstField: (node: HTMLInputElement | null) => void;
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

export function IntakeContactFields({
  input,
  errors,
  isChangeOrder,
  setTextField,
  registerFirstError,
  setFirstField
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold text-[var(--ink)] md:col-span-2">
        Document title
        <input
          className="field-control"
          value={input.documentTitle}
          aria-invalid={Boolean(errors.documentTitle)}
          aria-describedby={errors.documentTitle ? "documentTitle-error" : undefined}
          ref={(node) => {
            setFirstField(node);
            registerFirstError("documentTitle", node);
          }}
          onChange={(event) => setTextField("documentTitle", event.target.value)}
        />
        <InputError id="documentTitle-error" message={errors.documentTitle} />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Your business
        <input
          className="field-control"
          value={input.provider}
          autoComplete="organization"
          aria-invalid={Boolean(errors.provider)}
          aria-describedby={errors.provider ? "provider-error" : undefined}
          ref={(node) => registerFirstError("provider", node)}
          onChange={(event) => setTextField("provider", event.target.value)}
        />
        <InputError id="provider-error" message={errors.provider} />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Client
        <input
          className="field-control"
          value={input.client}
          autoComplete="name"
          aria-invalid={Boolean(errors.client)}
          aria-describedby={errors.client ? "client-error" : undefined}
          ref={(node) => registerFirstError("client", node)}
          onChange={(event) => setTextField("client", event.target.value)}
        />
        <InputError id="client-error" message={errors.client} />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Business email
        <input
          className="field-control"
          value={input.businessEmail}
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.businessEmail)}
          aria-describedby={errors.businessEmail ? "businessEmail-error" : undefined}
          ref={(node) => registerFirstError("businessEmail", node)}
          onChange={(event) => setTextField("businessEmail", event.target.value)}
        />
        <InputError id="businessEmail-error" message={errors.businessEmail} />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Business phone
        <input
          className="field-control"
          value={input.businessPhone}
          autoComplete="tel"
          onChange={(event) => setTextField("businessPhone", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Project
        <input
          className="field-control"
          value={input.project}
          onChange={(event) => setTextField("project", event.target.value)}
        />
      </label>

      {!isChangeOrder ? (
        <>
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Job location
            <input
              className="field-control"
              value={input.jobLocation}
              autoComplete="street-address"
              onChange={(event) => setTextField("jobLocation", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Start date
            <input
              className="field-control"
              type="date"
              value={input.startDate}
              onChange={(event) => setTextField("startDate", event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Completion target
            <input
              className="field-control"
              type="date"
              value={input.endDate}
              onChange={(event) => setTextField("endDate", event.target.value)}
            />
          </label>
        </>
      ) : null}

      <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
        Industry
        <select
          className="field-control"
          value={input.industry}
          onChange={(event) => setTextField("industry", event.target.value as Industry)}
        >
          {industries.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
