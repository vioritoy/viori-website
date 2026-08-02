create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('new', 'paid', 'making', 'shipped', 'completed', 'cancelled');
create type public.passport_status as enum ('issued', 'claimed', 'blocked', 'transferred');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ru text not null,
  name_en text not null,
  description_ru text not null default '',
  description_en text not null default '',
  category text not null check (category in ('animals', 'dolls', 'baby')),
  price_cents integer not null check (price_cents >= 0),
  size_cm numeric(6,2),
  lead_time_days integer not null default 14,
  materials_ru text not null default '',
  materials_en text not null default '',
  age_marking text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_ru text not null default '',
  alt_en text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  delivery_method text not null check (delivery_method in ('standard', 'pickup')),
  delivery_cents integer not null default 0,
  total_cents integer not null check (total_cents >= 0),
  payment_provider text,
  payment_reference text,
  status public.order_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  personalisation jsonb not null default '{}'::jsonb
);

create table public.nfc_passports (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  claim_token_hash text not null unique,
  character_name_ru text not null,
  character_name_en text not null,
  order_id uuid references public.orders(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  status public.passport_status not null default 'issued',
  issued_at timestamptz not null default now(),
  claimed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.toy_memories (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.nfc_passports(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  media_path text,
  happened_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_email text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.admin_activity (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.claim_nfc_passport(claim_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare passport_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.nfc_passports
     set owner_id = auth.uid(), status = 'claimed', claimed_at = now(), updated_at = now()
   where claim_token_hash = encode(digest(claim_token, 'sha256'), 'hex')
     and owner_id is null and status = 'issued'
  returning id into passport_id;
  if passport_id is null then raise exception 'invalid_or_already_claimed'; end if;
  return passport_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.nfc_passports enable row level security;
alter table public.toy_memories enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.admin_activity enable row level security;

create policy "profiles_read_own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "products_public_read" on public.products for select using (is_active or public.is_admin());
create policy "products_admin_all" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "product_images_public_read" on public.product_images for select using (exists(select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin())));
create policy "product_images_admin_all" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "orders_owner_read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items_owner_read" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "passports_owner_read" on public.nfc_passports for select using (owner_id = auth.uid() or public.is_admin());
create policy "passports_admin_all" on public.nfc_passports for all using (public.is_admin()) with check (public.is_admin());
create policy "memories_owner_all" on public.toy_memories for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "cancellations_owner_read" on public.cancellation_requests for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "admin_activity_admin_read" on public.admin_activity for select using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
       ('toy-memories', 'toy-memories', false, 10485760, array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4'])
on conflict (id) do nothing;

create policy "public_product_images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin_product_image_write" on storage.objects for all using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "memory_owner_read" on storage.objects for select using (bucket_id = 'toy-memories' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory_owner_write" on storage.objects for insert with check (bucket_id = 'toy-memories' and (storage.foldername(name))[1] = auth.uid()::text);
