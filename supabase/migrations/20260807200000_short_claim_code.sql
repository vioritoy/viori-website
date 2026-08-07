-- Код активации был 48 символов — такой не напечатать на карточке и не ввести
-- вручную. Теперь это 12 знаков, разбитых на три группы: A3F9-1C2D-40B7.
--
-- Алфавит — шестнадцатеричный (0-9 A-F), в нём нет пар, которые путают при
-- чтении: буквы O и I там не встречаются, поэтому 0 и 1 однозначны.
-- Случайность берётся из gen_random_uuid(), то есть источник криптостойкий.
-- 16^12 — около 280 триллионов вариантов, перебор по сети нереален.
--
-- Хэшируется каноническая форма: заглавные буквы без дефисов. Поэтому
-- клиент может вводить код как угодно — с дефисами, без них, строчными.

create or replace function public.issue_nfc_passport(name_ru text, name_en text, target_order_number text default null)
returns table(public_code text, claim_token text)
language plpgsql security definer set search_path = '' as $$
declare
  canonical text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  linked_order uuid;
  new_code text;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if nullif(trim(name_ru), '') is null or nullif(trim(name_en), '') is null then raise exception 'name_required'; end if;
  if nullif(trim(target_order_number), '') is not null then
    select id into linked_order from public.orders where order_number = trim(target_order_number);
    if linked_order is null then raise exception 'order_not_found'; end if;
  end if;

  new_code := 'VIO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.nfc_passports(public_code, claim_token_hash, character_name_ru, character_name_en, order_id)
  values(new_code, encode(sha256(convert_to(canonical, 'UTF8')), 'hex'), trim(name_ru), trim(name_en), linked_order);
  insert into public.admin_activity(admin_id, action, entity_type, entity_id)
  values(auth.uid(), 'issue', 'nfc_passport', new_code);

  return query select
    new_code,
    concat_ws('-', substr(canonical, 1, 4), substr(canonical, 5, 4), substr(canonical, 9, 4));
end;
$$;

create or replace function public.claim_nfc_passport(claim_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  passport_id uuid;
  -- Каноническая форма — как вводит человек, без дефисов и пробелов.
  canonical text := upper(regexp_replace(coalesce(claim_token, ''), '[^a-zA-Z0-9]', '', 'g'));
  canonical_hash text := encode(sha256(convert_to(canonical, 'UTF8')), 'hex');
  -- Старые длинные коды хэшировались как есть, поэтому проверяем и их.
  legacy_hash text := encode(sha256(convert_to(trim(coalesce(claim_token, '')), 'UTF8')), 'hex');
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.nfc_passports
     set owner_id = auth.uid(), status = 'claimed', claimed_at = now(), updated_at = now()
   where claim_token_hash in (canonical_hash, legacy_hash)
     and owner_id is null and status = 'issued'
  returning id into passport_id;
  if passport_id is null then raise exception 'invalid_or_already_claimed'; end if;
  return passport_id;
end;
$$;

revoke all on function public.issue_nfc_passport(text,text,text) from public, anon;
revoke all on function public.claim_nfc_passport(text) from public, anon;
grant execute on function public.issue_nfc_passport(text,text,text) to authenticated;
grant execute on function public.claim_nfc_passport(text) to authenticated;
