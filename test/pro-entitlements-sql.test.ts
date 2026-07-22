import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationsDir = new URL("../supabase/migrations/", import.meta.url);
const migrationName = readdirSync(migrationsDir).find((file) =>
  file.endsWith("_pro_entitlements_foundation.sql")
);

if (!migrationName) {
  throw new Error("The Pro entitlement migration is missing.");
}

const migration = readFileSync(new URL(migrationName, migrationsDir), "utf8").toLowerCase();

describe("Pro entitlement migration", () => {
  it("creates a provider-neutral subscription record with the supported lifecycle", () => {
    expect(migration).toContain("create table public.subscriptions");
    expect(migration).toContain("user_id uuid not null unique references auth.users (id)");
    expect(migration).toContain("check (plan in ('free', 'pro'))");
    expect(migration).toContain(
      "check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled', 'expired'))"
    );
    expect(migration).toContain("provider in ('manual', 'lemon_squeezy')");
    expect(migration).toContain("provider_subscription_id text unique");
    expect(migration).toContain("cancel_at_period_end boolean not null default false");
  });

  it("allows owner reads without exposing provider identifiers or browser writes", () => {
    expect(migration).toContain("alter table public.subscriptions enable row level security");
    expect(migration).toContain(
      "revoke all on table public.subscriptions from public, anon, authenticated"
    );
    expect(migration).toContain('create policy "subscriptions_select_own"');
    expect(migration).toContain("for select\nto authenticated");
    expect(migration).toContain("using ((select auth.uid()) = user_id)");

    const safeGrant = migration.slice(
      migration.indexOf("grant select ("),
      migration.indexOf(") on public.subscriptions to authenticated")
    );

    expect(safeGrant).toContain("plan");
    expect(safeGrant).toContain("status");
    expect(safeGrant).not.toContain("provider_customer_id");
    expect(safeGrant).not.toContain("provider_subscription_id");
    expect(migration).not.toContain("grant insert on public.subscriptions to authenticated");
    expect(migration).not.toContain("grant update on public.subscriptions to authenticated");
    expect(migration).not.toContain("grant delete on public.subscriptions to authenticated");
    expect(migration).toContain(
      "grant select, insert, update, delete on public.subscriptions to service_role"
    );
  });

  it("serializes document usage through an atomic private counter", () => {
    expect(migration).toContain("create table private.saved_document_usage");
    expect(migration).toContain("insert into private.saved_document_usage as usage");
    expect(migration).toContain("on conflict (user_id) do update");
    expect(migration).toContain("document_count = usage.document_count + 1");
    expect(migration).toContain("before insert on public.change_orders");
    expect(migration).toContain("after delete on public.change_orders");
    expect(migration).not.toContain("before update on public.change_orders");
    expect(migration).toContain("message = 'free_document_limit_reached'");
  });

  it("locks down trigger functions and applies the same Pro period rules", () => {
    expect(migration.match(/security definer/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(migration.match(/set search_path = ''/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(migration).toContain(
      "revoke all on function private.enforce_saved_document_limit() from public, anon, authenticated"
    );
    expect(migration).toContain("subscription.status in ('active', 'trialing')");
    expect(migration).toContain("subscription.status = 'cancelled'");
    expect(migration).toContain("subscription.current_period_end is not null");
    expect(migration).toContain(
      "subscription.current_period_end > pg_catalog.clock_timestamp()"
    );
  });

  it("backfills existing usage without deleting or hiding documents", () => {
    expect(migration).toContain("select user_id, count(*)\nfrom public.change_orders");
    expect(migration).not.toContain("delete from public.change_orders");
    expect(migration).not.toContain("update public.change_orders");
  });
});
