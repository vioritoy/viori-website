-- Заявки на индивидуальную игрушку с формы каталога.
-- Раньше форма только открывала почтовый клиент: заявка нигде не сохранялась,
-- а до администратора доходила, лишь если у посетителя настроена почта.

-- Часть этих объектов уже могла быть создана вручную через SQL-редактор,
-- поэтому миграция написана так, чтобы её можно было выполнить повторно:
-- иначе `supabase db push` падает на первом же «уже существует».
do $$ begin
  create type public.custom_request_status as enum ('new', 'in_progress', 'done');
exception when duplicate_object then null;
end $$;

create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  contact_email text not null check (char_length(contact_email) between 5 and 160),
  product text not null check (char_length(product) between 1 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  status public.custom_request_status not null default 'new'
);

create index if not exists custom_requests_created_at_idx on public.custom_requests (created_at desc);

alter table public.custom_requests enable row level security;

-- Читает и ведёт заявки только администратор. Прямая вставка не разрешена
-- никому: заявка принимается через функцию ниже, которая проверяет данные.
drop policy if exists "custom_requests_admin_read" on public.custom_requests;
create policy "custom_requests_admin_read" on public.custom_requests
  for select using (public.is_admin());
drop policy if exists "custom_requests_admin_update" on public.custom_requests;
create policy "custom_requests_admin_update" on public.custom_requests
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.submit_custom_request(
  customer_name text,
  contact_email text,
  product text,
  message text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if char_length(trim(coalesce(customer_name, ''))) < 2 then raise exception 'invalid_name'; end if;
  if trim(coalesce(contact_email, '')) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if char_length(trim(coalesce(message, ''))) < 1 then raise exception 'empty_message'; end if;

  insert into public.custom_requests(user_id, customer_name, contact_email, product, message)
  values (
    auth.uid(),
    left(trim(customer_name), 80),
    lower(left(trim(contact_email), 160)),
    left(coalesce(nullif(trim(product), ''), 'Кастомная игрушка'), 120),
    left(trim(message), 2000)
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Форму заполняют и незалогиненные посетители, поэтому доступ есть у anon.
revoke all on function public.submit_custom_request(text,text,text,text) from public;
grant execute on function public.submit_custom_request(text,text,text,text) to anon, authenticated;
