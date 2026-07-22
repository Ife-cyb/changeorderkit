import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationsDir = new URL("../supabase/migrations/", import.meta.url);
const migration = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .map((file) => readFileSync(new URL(file, migrationsDir), "utf8"))
  .join("\n")
  .toLowerCase();

describe("supabase rls migration", () => {
  it("enables rls and scopes policies to authenticated owners", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("alter table public.change_orders enable row level security");
    expect(migration.match(/to authenticated/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(migration).toContain("using ((select auth.uid()) = id)");
    expect(migration).toContain("with check ((select auth.uid()) = user_id)");
  });

  it("does not rely on JWT role checks or broad grants", () => {
    expect(migration).not.toContain("auth.role()");
    expect(migration).not.toContain("grant all");
  });

  it("adds document type support without weakening ownership", () => {
    expect(migration).toContain("document_type");
    expect(migration).toContain("'change-order'");
    expect(migration).toContain("'work-order'");
    expect(migration).toContain("'service-agreement'");
    expect(migration).toContain("change_orders_user_type_updated_idx");
    expect(migration).toContain("using ((select auth.uid()) = user_id)");
  });
  it("creates account profiles through a locked-down auth trigger", () => {
    expect(migration).toContain("create schema if not exists private");
    expect(migration).toContain("after insert on auth.users");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on function private.create_profile_for_new_user()");
  });
});
