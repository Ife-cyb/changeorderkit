import { describe, expect, it, vi } from "vitest";
import { createDefaultInput, defaultInput } from "../src/lib/change-order";
import {
  type ChangeOrderRepository,
  duplicateChangeOrderWithRepository,
  saveChangeOrderWithRepository,
  updateChangeOrderStatusWithRepository,
  deleteChangeOrderWithRepository
} from "../src/lib/change-order-service";
import type {
  ChangeOrderInsert,
  ChangeOrderRow,
  ChangeOrderUpdate
} from "../src/lib/change-order-records";

const now = "2026-07-08T00:00:00.000Z";

function rowFromInsert(id: string, payload: ChangeOrderInsert): ChangeOrderRow {
  return {
    id,
    user_id: payload.user_id,
    document_type: payload.document_type ?? "change-order",
    title: payload.title,
    client_name: payload.client_name ?? "",
    project_name: payload.project_name ?? "",
    status: payload.status ?? "draft",
    input: payload.input,
    total: payload.total ?? 0,
    currency: payload.currency ?? "USD",
    created_at: payload.created_at ?? now,
    updated_at: payload.updated_at ?? now
  };
}

class FakeRepository implements ChangeOrderRepository {
  rows = new Map<string, ChangeOrderRow>();
  nextId = 1;

  async insert(payload: ChangeOrderInsert) {
    const row = rowFromInsert(`co_${this.nextId++}`, payload);
    this.rows.set(row.id, row);
    return { data: row, error: null };
  }

  async update(userId: string, id: string, payload: ChangeOrderUpdate) {
    const row = this.rows.get(id);

    if (!row || row.user_id !== userId) {
      return { data: null, error: null };
    }

    const updated = {
      ...row,
      ...payload,
      user_id: row.user_id,
      id: row.id,
      updated_at: payload.updated_at ?? now
    };

    this.rows.set(id, updated);
    return { data: updated, error: null };
  }

  async get(userId: string, id: string) {
    const row = this.rows.get(id);
    return { data: row && row.user_id === userId ? row : null, error: null };
  }

  async delete(userId: string, id: string) {
    const row = this.rows.get(id);

    if (row && row.user_id === userId) {
      this.rows.delete(id);
      return { data: row, error: null };
    }

    return { data: null, error: null };
  }
}

describe("change order save actions with mocked repositories", () => {
  it("rejects unauthenticated saves", async () => {
    const repository = new FakeRepository();
    const result = await saveChangeOrderWithRepository(repository, null, defaultInput);

    expect(result.ok).toBe(false);
    expect(repository.rows.size).toBe(0);
  });

  it("saves and updates an owned change order", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "user_1", defaultInput);

    expect(saved.ok).toBe(true);
    expect(repository.rows.size).toBe(1);

    const id = saved.ok ? saved.id : "";
    const updated = await saveChangeOrderWithRepository(
      repository,
      "user_1",
      {
        ...defaultInput,
        documentTitle: "Updated title"
      },
      id
    );

    expect(updated.ok).toBe(true);
    expect(updated.ok ? updated.changeOrder?.title : "").toBe("Updated title");
  });

  it("rejects malformed or invalid input before calling the repository", async () => {
    const repository = new FakeRepository();
    const malformed = await saveChangeOrderWithRepository(repository, "user_1", {});
    const incomplete = await saveChangeOrderWithRepository(repository, "user_1", {
      ...defaultInput,
      project: ""
    });
    const invalidPrice = await saveChangeOrderWithRepository(repository, "user_1", {
      ...defaultInput,
      laborHours: -1
    });

    expect(malformed.ok).toBe(false);
    expect(incomplete.ok).toBe(false);
    expect(invalidPrice.ok).toBe(false);
    expect(repository.rows.size).toBe(0);
  });

  it("does not expose repository implementation details to callers", async () => {
    const repository = new FakeRepository();
    const internalMessage = 'relation "private_change_orders_v2" does not exist';
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(repository as ChangeOrderRepository, "insert").mockResolvedValue({
      data: null,
      error: { message: internalMessage }
    });

    const result = await saveChangeOrderWithRepository(repository, "user_1", defaultInput);

    expect(result).toEqual({
      ok: false,
      error: "The document request could not be completed. Please try again."
    });
    expect(JSON.stringify(result)).not.toContain(internalMessage);
    expect(log).toHaveBeenCalledWith("Change order repository request failed.", {
      message: internalMessage
    });
    log.mockRestore();
  });

  it("sanitizes document input before persistence", async () => {
    const repository = new FakeRepository();
    const result = await saveChangeOrderWithRepository(repository, "user_1", {
      ...defaultInput,
      documentTitle: `Safe\0${"x".repeat(300)}`
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.changeOrder?.title.includes("\0") : true).toBe(false);
    expect(result.ok ? result.changeOrder?.title.length : 0).toBe(180);
  });

  it("preserves document type when saving and duplicating documents", async () => {
    const repository = new FakeRepository();
    const workOrder = createDefaultInput(undefined, "work-order");
    const saved = await saveChangeOrderWithRepository(repository, "user_1", workOrder);
    const id = saved.ok ? saved.id ?? "" : "";

    expect(saved.ok ? saved.changeOrder?.documentType : "").toBe("work-order");
    expect(repository.rows.get(id)?.document_type).toBe("work-order");

    const duplicated = await duplicateChangeOrderWithRepository(repository, "user_1", id);

    expect(duplicated.ok ? duplicated.changeOrder?.documentType : "").toBe("work-order");
    expect(duplicated.ok ? duplicated.changeOrder?.input.documentType : "").toBe("work-order");
  });

  it("keeps a copy suffix when duplicating a maximum-length title", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "user_1", {
      ...defaultInput,
      documentTitle: "x".repeat(180)
    });
    const id = saved.ok ? saved.id ?? "" : "";
    const duplicated = await duplicateChangeOrderWithRepository(repository, "user_1", id);
    const duplicateTitle = duplicated.ok ? duplicated.changeOrder?.title ?? "" : "";

    expect(duplicateTitle).toHaveLength(180);
    expect(duplicateTitle.endsWith(" copy")).toBe(true);
    expect(duplicateTitle).not.toBe("x".repeat(180));
  });

  it("blocks wrong-owner updates", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "owner", defaultInput);
    const id = saved.ok ? saved.id : "";
    const result = await saveChangeOrderWithRepository(repository, "other-user", defaultInput, id);

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("not found");
  });

  it("archives, reopens, duplicates, and deletes owned rows", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "user_1", defaultInput);
    const id = saved.ok ? saved.id ?? "" : "";

    const archived = await updateChangeOrderStatusWithRepository(
      repository,
      "user_1",
      id,
      "archived"
    );
    expect(archived.ok ? archived.changeOrder?.status : "").toBe("archived");

    const reopened = await updateChangeOrderStatusWithRepository(repository, "user_1", id, "draft");
    expect(reopened.ok ? reopened.changeOrder?.status : "").toBe("draft");

    const duplicated = await duplicateChangeOrderWithRepository(repository, "user_1", id);
    expect(duplicated.ok).toBe(true);
    expect(repository.rows.size).toBe(2);
    expect(duplicated.ok ? duplicated.changeOrder?.title : "").toContain("copy");

    const deleted = await deleteChangeOrderWithRepository(repository, "user_1", id);
    expect(deleted.ok).toBe(true);
    expect(repository.rows.has(id)).toBe(false);
  });

  it("preserves status when saving ordinary content updates", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "user_1", defaultInput);
    const id = saved.ok ? saved.id ?? "" : "";

    await updateChangeOrderStatusWithRepository(repository, "user_1", id, "archived");
    const updated = await saveChangeOrderWithRepository(
      repository,
      "user_1",
      { ...defaultInput, documentTitle: "Edited archived document" },
      id
    );

    expect(updated.ok ? updated.changeOrder?.status : "").toBe("archived");
  });

  it("reports missing or wrong-owner deletes instead of false success", async () => {
    const repository = new FakeRepository();
    const saved = await saveChangeOrderWithRepository(repository, "owner", defaultInput);
    const id = saved.ok ? saved.id ?? "" : "";

    const wrongOwner = await deleteChangeOrderWithRepository(repository, "other-user", id);
    const missing = await deleteChangeOrderWithRepository(repository, "owner", "missing");

    expect(wrongOwner.ok).toBe(false);
    expect(missing.ok).toBe(false);
    expect(repository.rows.has(id)).toBe(true);
  });
});
