create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null default 'free'
    constraint subscriptions_plan_check check (plan in ('free', 'pro')),
  status text not null default 'inactive'
    constraint subscriptions_status_check
    check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled', 'expired')),
  provider text
    constraint subscriptions_provider_check
    check (provider is null or provider in ('manual', 'lemon_squeezy')),
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

revoke all on table public.subscriptions from public, anon, authenticated;

grant select (
  user_id,
  plan,
  status,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) on public.subscriptions to authenticated;

grant select, insert, update, delete on public.subscriptions to service_role;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

create table private.saved_document_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  document_count bigint not null default 0 check (document_count >= 0),
  updated_at timestamptz not null default now()
);

revoke all on table private.saved_document_usage from public, anon, authenticated;

-- Supabase migrations run transactionally. Hold this lock through the usage
-- backfill and trigger installation so concurrent writes cannot drift the count.
lock table public.change_orders in share row exclusive mode;

insert into private.saved_document_usage (user_id, document_count)
select user_id, count(*)
from public.change_orders
group by user_id
on conflict (user_id) do update
set
  document_count = excluded.document_count,
  updated_at = pg_catalog.clock_timestamp();

create or replace function private.set_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;

revoke all on function private.set_subscription_updated_at()
from public, anon, authenticated, service_role;

drop trigger if exists set_subscription_updated_at on public.subscriptions;
create trigger set_subscription_updated_at
before update on public.subscriptions
for each row execute function private.set_subscription_updated_at();

create or replace function private.enforce_saved_document_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  next_document_count bigint;
  has_pro_access boolean;
begin
  if request_user_id is not null and request_user_id <> new.user_id then
    raise insufficient_privilege using
      message = 'A document can only be saved for the authenticated user.';
  end if;

  insert into private.saved_document_usage as usage (
    user_id,
    document_count,
    updated_at
  )
  values (
    new.user_id,
    1,
    pg_catalog.clock_timestamp()
  )
  on conflict (user_id) do update
  set
    document_count = usage.document_count + 1,
    updated_at = pg_catalog.clock_timestamp()
  returning document_count into next_document_count;

  select exists (
    select 1
    from public.subscriptions as subscription
    where subscription.user_id = new.user_id
      and subscription.plan = 'pro'
      and (
        (
          subscription.status in ('active', 'trialing')
          and (
            subscription.current_period_end is null
            or subscription.current_period_end > pg_catalog.clock_timestamp()
          )
        )
        or (
          subscription.status = 'cancelled'
          and subscription.current_period_end is not null
          and subscription.current_period_end > pg_catalog.clock_timestamp()
        )
      )
  ) into has_pro_access;

  if next_document_count > 3 and not has_pro_access then
    raise exception using
      errcode = 'P0001',
      message = 'FREE_DOCUMENT_LIMIT_REACHED',
      detail = 'Free accounts can save up to 3 cloud documents. Existing documents remain available.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_saved_document_limit()
from public, anon, authenticated, service_role;

create or replace function private.release_saved_document_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is not null and request_user_id <> old.user_id then
    raise insufficient_privilege using
      message = 'A saved-document slot can only be released for the authenticated user.';
  end if;

  update private.saved_document_usage
  set
    document_count = greatest(document_count - 1, 0),
    updated_at = pg_catalog.clock_timestamp()
  where user_id = old.user_id;

  return old;
end;
$$;

revoke all on function private.release_saved_document_slot()
from public, anon, authenticated, service_role;

drop trigger if exists enforce_saved_document_limit_after_insert on public.change_orders;
create trigger enforce_saved_document_limit_after_insert
after insert on public.change_orders
for each row execute function private.enforce_saved_document_limit();

drop trigger if exists release_saved_document_slot_after_delete on public.change_orders;
create trigger release_saved_document_slot_after_delete
after delete on public.change_orders
for each row execute function private.release_saved_document_slot();
