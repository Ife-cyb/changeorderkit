import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260708000000_phase_2_accounts.sql", import.meta.url),
  "utf8"
).toLowerCase();

describe("supabase rls migration", () => {
  it("enables rls and scopes policies to authenticated owners", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("alter table public.change_orders enable row level security");
    expect(migration.match(/to authenticated/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(migration).toContain("using ((select auth.uid()) = id)");
    expect(migration).toContain("with check ((select auth.uid()) = user_id)");
  });

  it("does not rely on role checks or service-role grants", () => {
    expect(migration).not.toContain("auth.role()");
    expect(migration).not.toContain("service_role");
    expect(migration).not.toContain("grant all");
  });
});
