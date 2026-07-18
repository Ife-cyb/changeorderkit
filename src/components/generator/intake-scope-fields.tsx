import { AlertTriangle } from "lucide-react";
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
    <div className="mt-7 border-t border-[var(--border)] pt-7">
      <p className="panel-kicker mb-4">{scopeKicker}</p>
      <div className="grid gap-4">
        {isChangeOrder ? (
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Original agreed scope
            <textarea
              className="field-control"
              value={input.originalScope}
              aria-invalid={Boolean(errors.originalScope)}
              aria-describedby="originalScope-help originalScope-error"
              ref={(node) => registerFirstError("originalScope", node)}
              onChange={(event) => setTextField("originalScope", event.target.value)}
            />
            <span id="originalScope-help" className="text-sm font-medium text-[var(--muted)]">
              What was already included before the new request?
            </span>
            <InputError id="originalScope-error" message={errors.originalScope} />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          {primaryScopeLabel}
          <textarea
            className="field-control"
            value={input.newRequest}
            aria-invalid={Boolean(errors.newRequest)}
            aria-describedby="newRequest-help newRequest-error"
            ref={(node) => registerFirstError("newRequest", node)}
            onChange={(event) => setTextField("newRequest", event.target.value)}
          />
          <span id="newRequest-help" className="text-sm font-medium text-[var(--muted)]">
            {primaryScopeHelp}
          </span>
          <InputError id="newRequest-error" message={errors.newRequest} />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          {isChangeOrder ? "Schedule impact" : "Schedule notes"}
          <textarea
            className="field-control"
            value={input.scheduleImpact}
            onChange={(event) => setTextField("scheduleImpact", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
          Exclusions and scope boundary
          <textarea
            className="field-control"
            value={input.exclusions}
            onChange={(event) => setTextField("exclusions", event.target.value)}
          />
        </label>
        {!isChangeOrder ? (
          <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
            Client responsibilities
            <textarea
              className="field-control"
              value={input.clientResponsibilities}
              onChange={(event) => setTextField("clientResponsibilities", event.target.value)}
            />
          </label>
        ) : null}
        {isServiceAgreement ? (
          <>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
              Change policy
              <textarea
                className="field-control"
                value={input.changePolicy}
                onChange={(event) => setTextField("changePolicy", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">
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
    </div>
  );
}
