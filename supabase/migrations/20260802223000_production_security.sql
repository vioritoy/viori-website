-- Production hardening: privileged fields and commerce operations are server-controlled.

drop policy if exists "profiles_update_own" on public.profiles;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy "profiles_update_name" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

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
  new_order_number text := 'VIO-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
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

create or replace function public.request_order_cancellation(target_order_number text, cancellation_reason text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_order_id uuid; request_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select id into target_order_id from public.orders
   where order_number = target_order_number and user_id = auth.uid() and status not in ('shipped','completed','cancelled');
  if target_order_id is null then raise exception 'order_not_cancellable'; end if;
  insert into public.cancellation_requests(order_id, customer_email, reason)
    select target_order_id, email, left(coalesce(cancellation_reason, ''), 1000) from auth.users where id = auth.uid()
    returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.issue_nfc_passport(name_ru text, name_en text, target_order_number text default null)
returns table(public_code text, claim_token text)
language plpgsql security definer set search_path = '' as $$
declare raw_token text := encode(gen_random_bytes(24), 'hex'); linked_order uuid; new_code text;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if nullif(trim(name_ru), '') is null or nullif(trim(name_en), '') is null then raise exception 'name_required'; end if;
  if nullif(trim(target_order_number), '') is not null then
    select id into linked_order from public.orders where order_number = trim(target_order_number);
    if linked_order is null then raise exception 'order_not_found'; end if;
  end if;
  new_code := 'VIO-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));
  insert into public.nfc_passports(public_code, claim_token_hash, character_name_ru, character_name_en, order_id)
  values(new_code, encode(digest(raw_token, 'sha256'), 'hex'), trim(name_ru), trim(name_en), linked_order);
  insert into public.admin_activity(admin_id, action, entity_type, entity_id)
  values(auth.uid(), 'issue', 'nfc_passport', new_code);
  return query select new_code, raw_token;
end;
$$;

revoke all on function public.create_order(text,text,jsonb,text,jsonb) from public, anon;
revoke all on function public.request_order_cancellation(text,text) from public, anon;
revoke all on function public.issue_nfc_passport(text,text,text) from public, anon;
revoke all on function public.claim_nfc_passport(text) from public, anon;
grant execute on function public.create_order(text,text,jsonb,text,jsonb) to authenticated;
grant execute on function public.request_order_cancellation(text,text) to authenticated;
grant execute on function public.issue_nfc_passport(text,text,text) to authenticated;
grant execute on function public.claim_nfc_passport(text) to authenticated;

-- A real starter product so production never depends on a browser-only catalogue.
insert into public.products(slug, name_ru, name_en, description_ru, description_en, category, price_cents,
  lead_time_days, materials_ru, materials_en, age_marking, is_active)
values('mia-bunny', 'Зайка Мия', 'Mia the Bunny',
  'Мягкая игрушка ручной работы. Цвет одежды можно выбрать.',
  'A handmade soft toy. The outfit colour can be personalised.',
  'animals', 2900, 14, 'Состав уточняется перед продажей', 'Materials to be confirmed before sale',
  'Сертификация ещё не завершена', false)
on conflict (slug) do nothing;
