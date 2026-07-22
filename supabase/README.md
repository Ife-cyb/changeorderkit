# Supabase Setup

ChangeOrderKit uses Supabase Auth and Postgres. Billing-provider integration is not part of the entitlement-foundation migration.

1. Create a Supabase project.
2. Apply every file in `supabase/migrations` in filename order with the Supabase CLI or SQL editor. `20260722171653_pro_entitlements_foundation.sql` must be applied before deploying the plan-usage UI and Free save limit.
3. Add these env vars to Vercel preview and production when ready:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_TEMPLATE_KIT_LINK`
   - `NEXT_PUBLIC_SHOW_UPSELLS` (set to `true` only when an upsell link is ready)
4. Confirm `profiles`, `change_orders`, and the safe entitlement columns on `subscriptions` are exposed through the Data API for authenticated clients if your project uses explicit API exposure.

RLS is enabled on every public application table. Subscription clients receive only safe-column `SELECT` access to their own row; they receive no subscription `INSERT`, `UPDATE`, or `DELETE` permission. Provider customer and subscription identifiers are withheld from browser roles. Future trusted webhook code may write with a server-only service role, but no service-role credential belongs in this repository or a browser bundle.

The Free three-document limit is enforced by a private atomic per-user counter. The `BEFORE INSERT` trigger increments that counter under PostgreSQL row locking and raises `FREE_DOCUMENT_LIMIT_REACHED` when a non-Pro account would exceed three records. The failed statement rolls the counter increment back. An `AFTER DELETE` trigger releases a slot; updates never consume one. Existing usage is backfilled without deleting or hiding records.

## SQL verification

Run these read-only checks after applying the migration:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'subscriptions';

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'subscriptions'
order by grantee, column_name, privilege_type;

select
  has_table_privilege('authenticated', 'public.subscriptions', 'INSERT') as can_insert,
  has_table_privilege('authenticated', 'public.subscriptions', 'UPDATE') as can_update,
  has_table_privilege('authenticated', 'public.subscriptions', 'DELETE') as can_delete;

select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('subscriptions', 'change_orders')
order by event_object_table, trigger_name;
```

Expected results:

- One authenticated owner-scoped `SELECT` policy exists on `subscriptions`.
- Authenticated users have `SELECT` only on safe entitlement columns and no subscription write privilege.
- `change_orders` has a `BEFORE INSERT` limit trigger and an `AFTER DELETE` slot-release trigger.
- No trigger limits `UPDATE`, so existing-document edits remain available.

To exercise both Free and Pro behavior on a disposable or preview database, replace the placeholder UUID with a dedicated authenticated test user and run the following transaction. It restores all data with the final `rollback`:

```sql
begin;

delete from public.change_orders where user_id = '00000000-0000-0000-0000-000000000000';
delete from public.subscriptions where user_id = '00000000-0000-0000-0000-000000000000';

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000000';
  item integer;
begin
  for item in 1..3 loop
    insert into public.change_orders (user_id, title, input)
    values (test_user_id, 'Free limit test ' || item, '{}'::jsonb);
  end loop;

  begin
    insert into public.change_orders (user_id, title, input)
    values (test_user_id, 'Blocked fourth document', '{}'::jsonb);
    raise exception using message = 'EXPECTED_FREE_LIMIT_WAS_NOT_RAISED';
  exception
    when raise_exception then
      if sqlerrm <> 'FREE_DOCUMENT_LIMIT_REACHED' then
        raise;
      end if;
  end;

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    provider,
    current_period_end
  ) values (
    test_user_id,
    'pro',
    'active',
    'manual',
    pg_catalog.clock_timestamp() + interval '30 days'
  );

  insert into public.change_orders (user_id, title, input)
  values (test_user_id, 'Allowed Pro document', '{}'::jsonb);
end;
$$;

rollback;
```

Do not run the functional block against a real customer account. This repository does not apply the migration to production automatically; application and migration release remain separate operator steps.
