alter table public.change_orders
  add column if not exists document_type text not null default 'change-order';

update public.change_orders
set document_type =
  case
    when input->>'documentType' in ('change-order', 'work-order', 'service-agreement')
      then input->>'documentType'
    else 'change-order'
  end
where document_type = 'change-order';

update public.change_orders
set input =
  case
    when jsonb_typeof(input) = 'object'
      then jsonb_set(input, '{documentType}', to_jsonb(document_type), true)
    else jsonb_build_object('documentType', document_type)
  end;

do $$
begin
  alter table public.change_orders
    add constraint change_orders_document_type_check
    check (document_type in ('change-order', 'work-order', 'service-agreement'));
exception
  when duplicate_object then null;
end $$;

create index if not exists change_orders_user_type_updated_idx
  on public.change_orders (user_id, document_type, updated_at desc);
