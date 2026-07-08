create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  business_name text not null default '',
  contact_email text not null default '',
  phone text not null default '',
  default_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  client_name text not null default '',
  project_name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  input jsonb not null,
  total numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_id_idx on public.profiles (id);
create index if not exists change_orders_user_updated_idx
  on public.change_orders (user_id, updated_at desc);
create index if not exists change_orders_user_status_idx
  on public.change_orders (user_id, status);

alter table public.profiles enable row level security;
alter table public.change_orders enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.change_orders to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "change_orders_select_own" on public.change_orders;
create policy "change_orders_select_own"
on public.change_orders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "change_orders_insert_own" on public.change_orders;
create policy "change_orders_insert_own"
on public.change_orders
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "change_orders_update_own" on public.change_orders;
create policy "change_orders_update_own"
on public.change_orders
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "change_orders_delete_own" on public.change_orders;
create policy "change_orders_delete_own"
on public.change_orders
for delete
to authenticated
using ((select auth.uid()) = user_id);
