create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    contact_email,
    business_name,
    phone,
    default_settings
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.email, ''),
    '',
    '',
    '{}'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

insert into public.profiles (
  id,
  email,
  contact_email,
  business_name,
  phone,
  default_settings
)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.email, ''),
  '',
  '',
  '{}'::jsonb
from auth.users as users
on conflict (id) do nothing;
