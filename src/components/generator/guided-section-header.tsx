import { AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";

type Props = {
  number: string;
  title: string;
  description: string;
  ready: boolean;
  hasError: boolean;
  icon: LucideIcon;
};

export function GuidedSectionHeader({
  number,
  title,
  description,
  ready,
  hasError,
  icon: Icon
}: Props) {
  return (
    <div className="guided-section-header">
      <div className="guided-section-heading">
        <span className="guided-section-number" aria-hidden="true">
          {number}
        </span>
        <span className="guided-section-icon" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <span
        className={
          hasError
            ? "guided-section-state guided-section-state-error"
            : ready
              ? "guided-section-state guided-section-state-ready"
              : "guided-section-state"
        }
      >
        {hasError ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : ready ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : null}
        {hasError ? "Needs attention" : ready ? "Ready" : "In progress"}
      </span>
    </div>
  );
}
