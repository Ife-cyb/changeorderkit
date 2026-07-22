import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveAccountEntitlement } from "../src/lib/account-entitlements.server";

const now = new Date("2026-07-22T12:00:00.000Z");

type MockRequest = Promise<{
  data?: unknown;
  count?: number | null;
  error: { code?: string; message: string } | null;
}>;

function mockSupabase(subscriptionRequest: MockRequest, documentCountRequest: MockRequest) {
  return {
    from(table: string) {
      if (table === "subscriptions") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: () => subscriptionRequest
                };
              }
            };
          }
        };
      }

      return {
        select() {
          return {
            eq: () => documentCountRequest
          };
        }
      };
    }
  };
}

describe("server account entitlement resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fails a rejected subscription lookup safely to Free without hiding verified usage", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const supabase = mockSupabase(
      Promise.reject(new Error("network unavailable")),
      Promise.resolve({ data: null, count: 1, error: null })
    );

    const result = await resolveAccountEntitlement(
      supabase as never,
      "user_1",
      now
    );

    expect(result).toMatchObject({
      plan: "free",
      hasProAccess: false,
      subscriptionVerified: false,
      savedDocumentCount: 1,
      savedDocumentCountVerified: true,
      canCreateDocument: true,
      cloudSaveBlockReason: null
    });
    expect(log).toHaveBeenCalled();
  });

  it("blocks new cloud saves when document usage cannot be verified", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const supabase = mockSupabase(
      Promise.resolve({ data: null, error: null }),
      Promise.reject(new Error("count request failed"))
    );

    const result = await resolveAccountEntitlement(
      supabase as never,
      "user_1",
      now
    );

    expect(result).toMatchObject({
      plan: "free",
      subscriptionVerified: true,
      savedDocumentCountVerified: false,
      canCreateDocument: false,
      cloudSaveBlockReason: "verification_unavailable"
    });
    expect(log).toHaveBeenCalled();
  });
});
