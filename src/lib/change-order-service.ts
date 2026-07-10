import {
  type ChangeOrderInput,
  type ChangeOrderStatus,
  type SavedChangeOrder,
  sanitizeChangeOrderInput
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
  delete(userId: string, id: string): Promise<RepositoryResult<null>>;
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
    };

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
  return {
    ok: false,
    error: error?.message || "Something went wrong while saving the document."
  };
}

export async function saveChangeOrderWithRepository(
  repository: ChangeOrderRepository,
  userId: string | null | undefined,
  input: ChangeOrderInput,
  id?: string | null
): Promise<ChangeOrderActionResult> {
  if (!userId) {
    return authError();
  }

  if (id) {
    const result = await repository.update(userId, id, buildChangeOrderUpdate(input));

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

  const result = await repository.insert(buildChangeOrderInsert(userId, input));

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
  const duplicateInput: ChangeOrderInput = {
    ...originalInput,
    documentTitle: `${originalInput.documentTitle || original.data.title} copy`
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

  return {
    ok: true,
    id
  };
}
