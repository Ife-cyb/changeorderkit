import { AlertTriangle, ChevronDown } from "lucide-react";
import { type ChangeOrderInput, type ValidationErrors } from "@/lib/change-order";

type FieldNode = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

type Props = {
  input: ChangeOrderInput;
  errors: ValidationErrors;
  isChangeOrder: boolean;
  isServiceAgreement: boolean;
  scopeKicker: string;
  primaryScopeLabel: string;
  primaryScopeHelp: string;
  setTextField: (field: keyof ChangeOrderInput, value: string) => void;
  registerFirstError: (field: keyof ChangeOrderInput, node: FieldNode) => void;
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
export function IntakeScopeFields({
  input,
  errors,
  isChangeOrder,
  isServiceAgreement,
  scopeKicker,
  primaryScopeLabel,
  primaryScopeHelp,
  setTextField,
  registerFirstError
}: Props) {
  return (
    <>
      <div className="guided-fields grid gap-4">
        <label className="field-label">
          <span className="field-label-line">
            {primaryScopeLabel} <small>{scopeKicker}</small>
          </span>
          <textarea
            className="field-control field-control-emphasis"
            value={input.newRequest}
            placeholder={
              isChangeOrder
                ? "Describe exactly what the client asked to add or change."
                : "Describe the work, deliverables, and finished result."
            }
            aria-invalid={Boolean(errors.newRequest)}
            aria-describedby="newRequest-help newRequest-error"
            ref={(node) => registerFirstError("newRequest", node)}
            onChange={(event) => setTextField("newRequest", event.target.value)}
          />
          <span id="newRequest-help" className="field-help">
            {primaryScopeHelp}
          </span>
          <InputError id="newRequest-error" message={errors.newRequest} />
        </label>

        {isChangeOrder ? (
          <label className="field-label">
            Original agreed scope
            <textarea
              className="field-control"
              value={input.originalScope}
              placeholder="What was included before this request?"
              aria-invalid={Boolean(errors.originalScope)}
              aria-describedby="originalScope-help originalScope-error"
              ref={(node) => registerFirstError("originalScope", node)}
              onChange={(event) => setTextField("originalScope", event.target.value)}
            />
            <span id="originalScope-help" className="field-help">
              This makes the boundary between approved and added work easy to see.
            </span>
            <InputError id="originalScope-error" message={errors.originalScope} />
          </label>
        ) : null}
      </div>

      <details className="optional-disclosure">
        <summary>
          <span>
            Add schedule and safeguards
            <small>Timing, exclusions, responsibilities, and policies</small>
          </span>
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </summary>
        <div className="optional-disclosure-body grid gap-4">
          <label className="field-label">
            {isChangeOrder ? "Schedule impact" : "Schedule notes"} <small>Optional</small>
            <textarea
              className="field-control"
              value={input.scheduleImpact}
              placeholder="Adds one workday after materials arrive."
              onChange={(event) => setTextField("scheduleImpact", event.target.value)}
            />
          </label>

          <label className="field-label">
            Exclusions and scope boundary <small>Optional</small>
            <textarea
              className="field-control"
              value={input.exclusions}
              placeholder="List work, materials, permits, or hidden conditions that are not included."
              onChange={(event) => setTextField("exclusions", event.target.value)}
            />
          </label>

          {!isChangeOrder ? (
            <label className="field-label">
              Client responsibilities <small>Optional</small>
              <textarea
                className="field-control"
                value={input.clientResponsibilities}
                placeholder="Site access, final selections, approvals, or owner-supplied materials."
                onChange={(event) => setTextField("clientResponsibilities", event.target.value)}
              />
            </label>
          ) : null}

          {isServiceAgreement ? (
            <>
              <label className="field-label">
                Change policy
                <textarea
                  className="field-control"
                  value={input.changePolicy}
                  onChange={(event) => setTextField("changePolicy", event.target.value)}
                />
              </label>
              <label className="field-label">
                Cancellation language
                <textarea
                  className="field-control"
                  value={input.cancellationTerms}
                  onChange={(event) => setTextField("cancellationTerms", event.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>
      </details>
    </>
  );
}
