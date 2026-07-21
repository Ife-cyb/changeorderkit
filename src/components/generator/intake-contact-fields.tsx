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
  setProjectName: (value: string) => void;
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
  setProjectName,
  registerFirstError,
  setFirstField
}: Props) {
  return (
    <div className="guided-fields grid gap-4 md:grid-cols-2">
      <label className="field-label md:col-span-2">
        <span className="field-label-line">
          Document title <small>Builds itself from the project name</small>
        </span>
        <input
          className="field-control field-control-emphasis"
          value={input.documentTitle}
          placeholder="Work order for Oak Street kitchen"
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

      <label className="field-label">
        Your business
        <input
          className="field-control"
          value={input.provider}
          placeholder="Northline Renovations"
          autoComplete="organization"
          aria-invalid={Boolean(errors.provider)}
          aria-describedby={errors.provider ? "provider-error" : undefined}
          ref={(node) => registerFirstError("provider", node)}
          onChange={(event) => setTextField("provider", event.target.value)}
        />
        <InputError id="provider-error" message={errors.provider} />
      </label>

      <label className="field-label">
        Client
        <input
          className="field-control"
          value={input.client}
          placeholder="Jordan Lee"
          autoComplete="name"
          aria-invalid={Boolean(errors.client)}
          aria-describedby={errors.client ? "client-error" : undefined}
          ref={(node) => registerFirstError("client", node)}
          onChange={(event) => setTextField("client", event.target.value)}
        />
        <InputError id="client-error" message={errors.client} />
      </label>

      <label className="field-label">
        Business email
        <input
          className="field-control"
          value={input.businessEmail}
          type="email"
          autoComplete="email"
          placeholder="hello@yourbusiness.com"
          aria-invalid={Boolean(errors.businessEmail)}
          aria-describedby={errors.businessEmail ? "businessEmail-error" : undefined}
          ref={(node) => registerFirstError("businessEmail", node)}
          onChange={(event) => setTextField("businessEmail", event.target.value)}
        />
        <InputError id="businessEmail-error" message={errors.businessEmail} />
      </label>

      <label className="field-label">
        Business phone
        <input
          className="field-control"
          value={input.businessPhone}
          autoComplete="tel"
          placeholder="(555) 014-2204"
          onChange={(event) => setTextField("businessPhone", event.target.value)}
        />
      </label>

      <label className="field-label">
        Project
        <input
          className="field-control field-control-emphasis"
          value={input.project}
          placeholder="Oak Street kitchen"
          onChange={(event) => setProjectName(event.target.value)}
        />
      </label>

      {!isChangeOrder ? (
        <>
          <label className="field-label">
            Job location
            <input
              className="field-control"
              value={input.jobLocation}
              autoComplete="street-address"
              placeholder="42 Oak Street"
              onChange={(event) => setTextField("jobLocation", event.target.value)}
            />
          </label>

          <label className="field-label">
            Start date
            <input
              className="field-control"
              type="date"
              value={input.startDate}
              onChange={(event) => setTextField("startDate", event.target.value)}
            />
          </label>

          <label className="field-label">
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

      <label className="field-label">
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
