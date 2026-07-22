import {
  type BusinessProfile,
  type ChangeOrderInput,
  type DocumentType,
  createDefaultInput,
  documentTypeLabel,
  documentTypeOptions
} from "@/lib/change-order";

const templateFields = [
  "originalScope",
  "newRequest",
  "scheduleImpact",
  "clientResponsibilities",
  "exclusions",
  "changePolicy",
  "cancellationTerms"
] as const satisfies ReadonlyArray<keyof ChangeOrderInput>;

export function automaticDocumentTitle(documentType: DocumentType, project: string) {
  const trimmedProject = project.trim();
  return trimmedProject ? `${documentTypeLabel(documentType)} for ${trimmedProject}` : "";
}

export function saveCompletionState(revisionAtSave: number, currentRevision: number) {
  const hasNewerEdits = currentRevision !== revisionAtSave;

  return {
    hasNewerEdits,
    shouldNavigateToSavedDocument: !hasNewerEdits
  };
}

export function accountNewDraftStorageKey(userId: string) {
  return `changeorderkit:account:${userId}:new-draft:v1`;
}

function isSeededExampleDraft(input: ChangeOrderInput) {
  const example = createDefaultInput(undefined, input.documentType);

  return (
    input.client === example.client &&
    input.project === example.project &&
    input.newRequest === example.newRequest
  );
}

export function transitionDocumentType(
  input: ChangeOrderInput,
  nextDocumentType: DocumentType,
  businessProfile?: BusinessProfile | null
): ChangeOrderInput {
  if (input.documentType === nextDocumentType) {
    return input;
  }

  const nextExample = createDefaultInput(businessProfile ?? undefined, nextDocumentType);
  const knownExamples = documentTypeOptions.map((option) =>
    createDefaultInput(undefined, option.value)
  );
  const currentIsSeededExample = isSeededExampleDraft(input);
  const currentAutomaticTitle = automaticDocumentTitle(input.documentType, input.project);
  const titleIsAutomatic =
    Boolean(currentAutomaticTitle) && input.documentTitle === currentAutomaticTitle;
  const titleIsSeededExample = knownExamples.some(
    (example) => example.documentTitle === input.documentTitle
  );
  const next: ChangeOrderInput = {
    ...input,
    documentType: nextDocumentType,
    documentTitle: titleIsAutomatic
      ? automaticDocumentTitle(nextDocumentType, input.project)
      : titleIsSeededExample
        ? nextExample.documentTitle
        : input.documentTitle
  };

  for (const field of templateFields) {
    const currentValue = input[field];
    const isKnownExampleValue =
      currentValue.trim().length > 0 &&
      knownExamples.some((example) => example[field] === currentValue);
    const isBlankSeededValue = currentIsSeededExample && currentValue.trim().length === 0;

    next[field] =
      isKnownExampleValue || isBlankSeededValue ? nextExample[field] : currentValue;
  }

  return next;
}
