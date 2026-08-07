-- Имя персонажу даёт владелец, а не мастер: игрушка становится своей тогда,
-- когда её называют в семье. Имя от мастера остаётся необязательной рабочей
-- пометкой, чтобы в админке было видно, какой это паспорт.

alter table public.nfc_passports
  add column if not exists owner_name text;

-- Имя при выпуске больше не обязательно.
create or replace function public.issue_nfc_passport(name_ru text, name_en text, target_order_number text default null)
returns table(public_code text, claim_token text)
language plpgsql security definer set search_path = '' as $$
declare
  canonical text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  linked_order uuid;
  new_code text;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if nullif(trim(coalesce(target_order_number, '')), '') is not null then
    select id into linked_order from public.orders where order_number = trim(target_order_number);
    if linked_order is null then raise exception 'order_not_found'; end if;
  end if;

  new_code := 'VIO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.nfc_passports(public_code, claim_token_hash, character_name_ru, character_name_en, order_id)
  values(
    new_code,
    encode(sha256(convert_to(canonical, 'UTF8')), 'hex'),
    left(trim(coalesce(name_ru, '')), 120),
    left(trim(coalesce(name_en, '')), 120),
    linked_order
  );
  insert into public.admin_activity(admin_id, action, entity_type, entity_id)
  values(auth.uid(), 'issue', 'nfc_passport', new_code);

  return query select
    new_code,
    concat_ws('-', substr(canonical, 1, 4), substr(canonical, 5, 4), substr(canonical, 9, 4));
end;
$$;

-- Владелец называет игрушку сам. Отдельная функция, а не политика на таблицу:
-- менять можно только это поле и только у своего паспорта.
create or replace function public.set_passport_name(target_passport uuid, new_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(new_name, ''))) < 1 then raise exception 'name_required'; end if;
  update public.nfc_passports
     set owner_name = left(trim(new_name), 60), updated_at = now()
   where id = target_passport and owner_id = auth.uid();
  if not found then raise exception 'passport_not_owned'; end if;
end;
$$;

revoke all on function public.set_passport_name(uuid,text) from public, anon;
grant execute on function public.set_passport_name(uuid,text) to authenticated;

drop function if exists public.passport_preview(text);

create function public.passport_preview(code text)
returns table(
  owner_name text,
  character_name_ru text,
  character_name_en text,
  is_activated boolean,
  story jsonb,
  photo_path text
)
language sql security definer stable set search_path = '' as $$
  select
    p.owner_name,
    p.character_name_ru,
    p.character_name_en,
    p.status in ('claimed', 'transferred'),
    p.story,
    p.photo_path
  from public.nfc_passports p
  where p.public_code = upper(trim(code))
  limit 1;
$$;

revoke all on function public.passport_preview(text) from public;
grant execute on function public.passport_preview(text) to anon, authenticated;
