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
  status?: number;
};

export const FREE_DOCUMENT_LIMIT_REACHED = "FREE_DOCUMENT_LIMIT_REACHED" as const;
export const AUTH_REQUIRED = "AUTH_REQUIRED" as const;
export const AUTH_VERIFICATION_FAILED = "AUTH_VERIFICATION_FAILED" as const;
export const DATABASE_REQUEST_FAILED = "DATABASE_REQUEST_FAILED" as const;
export const NETWORK_REQUEST_FAILED = "NETWORK_REQUEST_FAILED" as const;
export const DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND" as const;
export const SERVICE_NOT_CONFIGURED = "SERVICE_NOT_CONFIGURED" as const;

export type ChangeOrderActionErrorCode =
  | typeof FREE_DOCUMENT_LIMIT_REACHED
  | typeof AUTH_REQUIRED
  | typeof AUTH_VERIFICATION_FAILED
  | typeof DATABASE_REQUEST_FAILED
  | typeof NETWORK_REQUEST_FAILED
  | typeof DOCUMENT_NOT_FOUND
  | typeof SERVICE_NOT_CONFIGURED;

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
      code?: ChangeOrderActionErrorCode;
    };

function authError(): ChangeOrderActionResult {
  return {
    ok: false,
    code: AUTH_REQUIRED,
    error: "Sign in to save documents."
  };
}

function notFoundError(): ChangeOrderActionResult {
  return {
    ok: false,
    code: DOCUMENT_NOT_FOUND,
    error: "Document not found or you do not have access."
  };
}

function repositoryError(
  error: RepositoryError | null,
  status?: number
): ChangeOrderActionResult {
  if (status === 0) {
    return networkError(error);
  }

  if (
    error?.code === "P0001" &&
    error.message.includes(FREE_DOCUMENT_LIMIT_REACHED)
  ) {
    return {
      ok: false,
      code: FREE_DOCUMENT_LIMIT_REACHED,
      error:
        "Free includes up to 3 cloud-saved documents. Your existing documents are unchanged, and this document is still available to copy, download, or print. Delete saved documents until fewer than 3 remain to free a cloud slot."
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
    code: DATABASE_REQUEST_FAILED,
    error: "The document request could not be completed. Please try again."
  };
}

function networkError(error: unknown): ChangeOrderActionResult {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "Unknown repository failure";

  console.error("Change order repository request did not complete.", {
    message
  });

  return {
    ok: false,
    code: NETWORK_REQUEST_FAILED,
    error:
      "The saved-document service could not be reached. Your edits are still here; check your connection and try again."
  };
}

async function repositoryRequest<T>(request: () => Promise<RepositoryResult<T>>) {
  try {
    return {
      ok: true as const,
      result: await request()
    };
  } catch (error) {
    return {
      ok: false as const,
      result: networkError(error)
    };
  }
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
    const request = await repositoryRequest(() =>
      repository.update(userId, id, buildChangeOrderUpdate(prepared.input))
    );

    if (!request.ok) {
      return request.result;
    }

    const result = request.result;

    if (result.error) {
      return repositoryError(result.error, result.status);
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

  const request = await repositoryRequest(() =>
    repository.insert(buildChangeOrderInsert(userId, prepared.input))
  );

  if (!request.ok) {
    return request.result;
  }

  const result = request.result;

  if (result.error) {
    return repositoryError(result.error, result.status);
  }

  if (!result.data) {
    return repositoryError(null, result.status);
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

  const request = await repositoryRequest(() =>
    repository.update(userId, id, {
      status,
      updated_at: new Date().toISOString()
    })
  );

  if (!request.ok) {
    return request.result;
  }

  const result = request.result;

  if (result.error) {
    return repositoryError(result.error, result.status);
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

  const originalRequest = await repositoryRequest(() => repository.get(userId, id));

  if (!originalRequest.ok) {
    return originalRequest.result;
  }

  const original = originalRequest.result;

  if (original.error) {
    return repositoryError(original.error, original.status);
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

  const duplicateRequest = await repositoryRequest(() =>
    repository.insert(buildChangeOrderInsert(userId, duplicateInput, "draft"))
  );

  if (!duplicateRequest.ok) {
    return duplicateRequest.result;
  }

  const result = duplicateRequest.result;

  if (result.error) {
    return repositoryError(result.error, result.status);
  }

  if (!result.data) {
    return repositoryError(null, result.status);
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

  const request = await repositoryRequest(() => repository.delete(userId, id));

  if (!request.ok) {
    return request.result;
  }

  const result = request.result;

  if (result.error) {
    return repositoryError(result.error, result.status);
  }

  if (!result.data) {
    return notFoundError();
  }

  return {
    ok: true,
    id
  };
}
