-- Функции объявлены с `set search_path = ''`, а gen_random_bytes и digest
-- принадлежат расширению pgcrypto, которое лежит в отдельной схеме. С пустым
-- search_path они не находятся, и вызов падал с 42883:
--   function gen_random_bytes(integer) does not exist
-- Из-за этого не работали оформление заказа, выпуск NFC-паспортов и передача
-- паспорта другому владельцу.
--
-- Переходим на функции ядра, которые доступны всегда (pg_catalog ищется даже
-- при пустом search_path):
--   gen_random_bytes -> gen_random_uuid()  (криптостойкий источник случайности)
--   digest(x,'sha256') -> sha256(convert_to(x,'UTF8'))
--
-- Значения хэшей при этом не меняются: digest хэширует байты текста в кодировке
-- сервера, convert_to(...,'UTF8') даёт те же байты. Уже выданные claim_token и
-- токены передачи продолжают работать.

create or replace function public.create_order(
  customer_name text,
  customer_phone text,
  shipping_address jsonb,
  delivery_method text,
  cart_items jsonb
) returns table(order_id uuid, order_number text)
language plpgsql security definer set search_path = '' as $$
declare
  new_order_id uuid := gen_random_uuid();
  new_order_number text := 'VIO-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  delivery_amount integer := case when delivery_method = 'pickup' then 0 else 695 end;
  items_amount integer;
  customer_email text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if delivery_method not in ('standard', 'pickup') then raise exception 'invalid_delivery_method'; end if;
  if jsonb_typeof(cart_items) <> 'array' or jsonb_array_length(cart_items) = 0 then raise exception 'empty_cart'; end if;
  if char_length(trim(customer_name)) < 2 or char_length(trim(customer_phone)) < 5 then raise exception 'invalid_customer_details'; end if;

  select email into customer_email from auth.users where id = auth.uid();
  select sum(p.price_cents * greatest(1, least(20, (item->>'quantity')::integer)))::integer
    into items_amount
    from jsonb_array_elements(cart_items) item
    join public.products p on p.id = (item->>'product_id')::uuid and p.is_active;
  if items_amount is null then raise exception 'invalid_cart'; end if;

  insert into public.orders(id, order_number, user_id, customer_email, customer_name, customer_phone,
    shipping_address, delivery_method, delivery_cents, total_cents, status)
  values(new_order_id, new_order_number, auth.uid(), customer_email, trim(customer_name), trim(customer_phone),
    shipping_address, delivery_method, delivery_amount, items_amount + delivery_amount, 'new');

  insert into public.order_items(order_id, product_id, product_name, unit_price_cents, quantity)
  select new_order_id, p.id, p.name_en, p.price_cents, greatest(1, least(20, (item->>'quantity')::integer))
    from jsonb_array_elements(cart_items) item
    join public.products p on p.id = (item->>'product_id')::uuid and p.is_active;

  return query select new_order_id, new_order_number;
end;
$$;

create or replace function public.issue_nfc_passport(name_ru text, name_en text, target_order_number text default null)
returns table(public_code text, claim_token text)
language plpgsql security definer set search_path = '' as $$
declare
  raw_token text := substr(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 48);
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
  values(new_code, encode(sha256(convert_to(raw_token, 'UTF8')), 'hex'), trim(name_ru), trim(name_en), linked_order);
  insert into public.admin_activity(admin_id, action, entity_type, entity_id)
  values(auth.uid(), 'issue', 'nfc_passport', new_code);
  return query select new_code, raw_token;
end;
$$;

create or replace function public.claim_nfc_passport(claim_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare passport_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.nfc_passports
     set owner_id = auth.uid(), status = 'claimed', claimed_at = now(), updated_at = now()
   where claim_token_hash = encode(sha256(convert_to(claim_token, 'UTF8')), 'hex')
     and owner_id is null and status = 'issued'
  returning id into passport_id;
  if passport_id is null then raise exception 'invalid_or_already_claimed'; end if;
  return passport_id;
end;
$$;

create or replace function public.create_passport_transfer(target_passport uuid, recipient_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  recipient_id uuid;
  raw_token text := substr(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 48);
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.nfc_passports where id = target_passport and owner_id = auth.uid() and status = 'claimed') then raise exception 'passport_not_owned'; end if;
  select id into recipient_id from auth.users where lower(email) = lower(trim(recipient_email));
  if recipient_id is null or recipient_id = auth.uid() then raise exception 'invalid_recipient'; end if;
  delete from public.passport_transfers where passport_id = target_passport and accepted_at is null;
  insert into public.passport_transfers(passport_id, from_owner_id, to_owner_id, token_hash)
  values(target_passport, auth.uid(), recipient_id, encode(sha256(convert_to(raw_token, 'UTF8')), 'hex'));
  return raw_token;
end;
$$;

create or replace function public.accept_passport_transfer(transfer_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare transfer_record public.passport_transfers%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into transfer_record from public.passport_transfers
   where token_hash = encode(sha256(convert_to(transfer_token, 'UTF8')), 'hex') and to_owner_id = auth.uid()
     and accepted_at is null and expires_at > now() for update;
  if transfer_record.id is null then raise exception 'invalid_or_expired_transfer'; end if;
  update public.nfc_passports set owner_id = auth.uid(), status = 'claimed', updated_at = now()
   where id = transfer_record.passport_id and owner_id = transfer_record.from_owner_id;
  if not found then raise exception 'passport_owner_changed'; end if;
  update public.passport_transfers set accepted_at = now() where id = transfer_record.id;
  return transfer_record.passport_id;
end;
$$;

-- create or replace сохраняет ранее выданные права, но повторяем их явно,
-- чтобы миграцию можно было применить на чистой базе.
revoke all on function public.create_order(text,text,jsonb,text,jsonb) from public, anon;
revoke all on function public.issue_nfc_passport(text,text,text) from public, anon;
revoke all on function public.claim_nfc_passport(text) from public, anon;
revoke all on function public.create_passport_transfer(uuid,text) from public, anon;
revoke all on function public.accept_passport_transfer(text) from public, anon;

grant execute on function public.create_order(text,text,jsonb,text,jsonb) to authenticated;
grant execute on function public.issue_nfc_passport(text,text,text) to authenticated;
grant execute on function public.claim_nfc_passport(text) to authenticated;
grant execute on function public.create_passport_transfer(uuid,text) to authenticated;
grant execute on function public.accept_passport_transfer(text) to authenticated;
