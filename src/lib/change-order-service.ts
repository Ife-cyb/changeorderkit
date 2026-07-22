import {
  type ChangeOrderInput,
  type ChangeOrderStatus,
  type SavedChangeOrder,
  sanitizeChangeOrderInput,
  validateChangeOrder
} from "@/lib/change-order";
import {
  type ChangeOrderInsert,
  type ChangeOrderRow,
  type ChangeOrderUpdate,
  buildChangeOrderInsert,
  buildChangeOrderUpdate,
  changeOrderFromRow
} from "@/lib/change-order-records";

export type RepositoryError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type RepositoryResult<T> = {
  data: T | null;
  error: RepositoryError | null;
};

export type ChangeOrderRepository = {
  insert(payload: ChangeOrderInsert): Promise<RepositoryResult<ChangeOrderRow>>;
  update(
    userId: string,
    id: string,
    payload: ChangeOrderUpdate
  ): Promise<RepositoryResult<ChangeOrderRow>>;
  get(userId: string, id: string): Promise<RepositoryResult<ChangeOrderRow>>;
  delete(userId: string, id: string): Promise<RepositoryResult<ChangeOrderRow>>;
};

export type ChangeOrderActionResult =
  | {
      ok: true;
      changeOrder?: SavedChangeOrder;
      id?: string;
    }
  | {
      ok: false;
      error: string;
      code?: typeof FREE_DOCUMENT_LIMIT_REACHED;
    };

export const FREE_DOCUMENT_LIMIT_REACHED = "FREE_DOCUMENT_LIMIT_REACHED" as const;

function authError(): ChangeOrderActionResult {
  return {
    ok: false,
    error: "Sign in to save documents."
  };
}

function notFoundError(): ChangeOrderActionResult {
  return {
    ok: false,
    error: "Document not found or you do not have access."
  };
}

function repositoryError(error: RepositoryError | null): ChangeOrderActionResult {
  if (
    error?.code === "P0001" &&
    error.message.includes(FREE_DOCUMENT_LIMIT_REACHED)
  ) {
    return {
      ok: false,
      code: FREE_DOCUMENT_LIMIT_REACHED,
      error:
        "Free includes up to 3 cloud-saved documents. Your existing documents are unchanged, and this document is still available to copy, download, or print. Delete one saved document to free a cloud slot."
    };
  }

  if (error) {
    console.error("Change order repository request failed.", {
      code: error.code,
      message: error.message
    });
  }

  return {
    ok: false,
    error: "The document request could not be completed. Please try again."
  };
}

const requiredStringFields = [
  "documentTitle",
  "provider",
  "client",
  "project",
  "newRequest"
] as const;

const numericFields = [
  "laborHours",
  "hourlyRate",
  "materialsCost",
  "marginPercent",
  "rushPercent",
  "depositPercent"
] as const;

function prepareInputForSave(value: unknown):
  | {
      ok: true;
      input: ChangeOrderInput;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      error: "The document data is invalid. Reload the page and try again."
    };
  }

  const raw = value as Record<string, unknown>;
  const input = sanitizeChangeOrderInput(value);
  const stringsToCheck =
    input.documentType === "change-order"
      ? [...requiredStringFields, "originalScope" as const]
      : requiredStringFields;

  if (stringsToCheck.some((field) => typeof raw[field] !== "string")) {
    return {
      ok: false,
      error: "The document data is incomplete. Reload the page and try again."
    };
  }

  const validationInput = { ...input };

  for (const field of numericFields) {
    const value = raw[field];

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        ok: false,
        error: "The pricing data is invalid. Check the amounts and try again."
      };
    }

    validationInput[field] = value;
  }

  const firstValidationError = Object.values(validateChangeOrder(validationInput)).find(
    (message): message is string => typeof message === "string"
  );

  if (firstValidationError) {
    return {
      ok: false,
      error: firstValidationError
    };
  }

  return {
    ok: true,
    input
  };
}

export async function saveChangeOrderWithRepository(
  repository: ChangeOrderRepository,
  userId: string | null | undefined,
  input: unknown,
  id?: string | null
): Promise<ChangeOrderActionResult> {
  if (!userId) {
    return authError();
  }

  const prepared = prepareInputForSave(input);

  if (!prepared.ok) {
    return prepared;
  }

  if (id) {
    const result = await repository.update(userId, id, buildChangeOrderUpdate(prepared.input));

    if (result.error) {
      return repositoryError(result.error);
    }

    if (!result.data) {
      return notFoundError();
    }

    const changeOrder = changeOrderFromRow(result.data);

    return {
      ok: true,
      changeOrder,
      id: changeOrder.id
    };
  }

  const result = await repository.insert(buildChangeOrderInsert(userId, prepared.input));

  if (result.error) {
    return repositoryError(result.error);
  }

  if (!result.data) {
    return repositoryError(null);
  }

  const changeOrder = changeOrderFromRow(result.data);

  return {
    ok: true,
    changeOrder,
    id: changeOrder.id
  };
}

export async function updateChangeOrderStatusWithRepository(
  repository: ChangeOrderRepository,
  userId: string | null | undefined,
  id: string,
  status: ChangeOrderStatus
): Promise<ChangeOrderActionResult> {
  if (!userId) {
    return authError();
  }

  const result = await repository.update(userId, id, {
    status,
    updated_at: new Date().toISOString()
  });

  if (result.error) {
    return repositoryError(result.error);
  }

  if (!result.data) {
    return notFoundError();
  }

  const changeOrder = changeOrderFromRow(result.data);

  return {
    ok: true,
    changeOrder,
    id: changeOrder.id
  };
}

export async function duplicateChangeOrderWithRepository(
  repository: ChangeOrderRepository,
  userId: string | null | undefined,
  id: string
): Promise<ChangeOrderActionResult> {
  if (!userId) {
    return authError();
  }

  const original = await repository.get(userId, id);

  if (original.error) {
    return repositoryError(original.error);
  }

  if (!original.data) {
    return notFoundError();
  }

  const originalInput = sanitizeChangeOrderInput(original.data.input, original.data.document_type);
  const duplicateSuffix = " copy";
  const duplicateTitle = (originalInput.documentTitle || original.data.title).trim();
  const duplicateInput: ChangeOrderInput = {
    ...originalInput,
    documentTitle: `${duplicateTitle.slice(0, 180 - duplicateSuffix.length)}${duplicateSuffix}`
  };

  const result = await repository.insert(buildChangeOrderInsert(userId, duplicateInput, "draft"));

  if (result.error) {
    return repositoryError(result.error);
  }

  if (!result.data) {
    return repositoryError(null);
  }

  const changeOrder = changeOrderFromRow(result.data);

  return {
    ok: true,
    changeOrder,
    id: changeOrder.id
  };
}

export async function deleteChangeOrderWithRepository(
  repository: ChangeOrderRepository,
  userId: string | null | undefined,
  id: string
): Promise<ChangeOrderActionResult> {
  if (!userId) {
    return authError();
  }

  const result = await repository.delete(userId, id);

  if (result.error) {
    return repositoryError(result.error);
  }

  if (!result.data) {
    return notFoundError();
  }

  return {
    ok: true,
    id
  };
}
