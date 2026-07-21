import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "../src/lib/supabase/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseConfig", () => {
  it.each(["https://example.supabase.co", "http://127.0.0.1:54321"])(
    "accepts an HTTP Supabase URL: %s",
    (url) => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

      expect(getSupabaseConfig()).toEqual({
        url,
        publishableKey: "sb_publishable_test"
      });
    }
  );

  it.each(["ftp://example.supabase.co", "javascript:alert(1)", "not a URL"])(
    "rejects an unsupported Supabase URL: %s",
    (url) => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

      expect(getSupabaseConfig()).toBeNull();
    }
  );
});
