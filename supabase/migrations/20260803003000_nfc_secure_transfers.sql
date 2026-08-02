create table public.passport_transfers (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.nfc_passports(id) on delete cascade,
  from_owner_id uuid not null references public.profiles(id) on delete cascade,
  to_owner_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.passport_transfers enable row level security;
create policy "transfer_participants_read" on public.passport_transfers for select
  using (from_owner_id = auth.uid() or to_owner_id = auth.uid() or public.is_admin());

create or replace function public.create_passport_transfer(target_passport uuid, recipient_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare recipient_id uuid; raw_token text := encode(gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.nfc_passports where id = target_passport and owner_id = auth.uid() and status = 'claimed') then raise exception 'passport_not_owned'; end if;
  select id into recipient_id from auth.users where lower(email) = lower(trim(recipient_email));
  if recipient_id is null or recipient_id = auth.uid() then raise exception 'invalid_recipient'; end if;
  delete from public.passport_transfers where passport_id = target_passport and accepted_at is null;
  insert into public.passport_transfers(passport_id, from_owner_id, to_owner_id, token_hash)
  values(target_passport, auth.uid(), recipient_id, encode(digest(raw_token, 'sha256'), 'hex'));
  return raw_token;
end;
$$;

create or replace function public.accept_passport_transfer(transfer_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare transfer_record public.passport_transfers%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into transfer_record from public.passport_transfers
   where token_hash = encode(digest(transfer_token, 'sha256'), 'hex') and to_owner_id = auth.uid()
     and accepted_at is null and expires_at > now() for update;
  if transfer_record.id is null then raise exception 'invalid_or_expired_transfer'; end if;
  update public.nfc_passports set owner_id = auth.uid(), status = 'claimed', updated_at = now()
   where id = transfer_record.passport_id and owner_id = transfer_record.from_owner_id;
  if not found then raise exception 'passport_owner_changed'; end if;
  update public.passport_transfers set accepted_at = now() where id = transfer_record.id;
  return transfer_record.passport_id;
end;
$$;

revoke all on function public.create_passport_transfer(uuid,text) from public, anon;
revoke all on function public.accept_passport_transfer(text) from public, anon;
grant execute on function public.create_passport_transfer(uuid,text) to authenticated;
grant execute on function public.accept_passport_transfer(text) to authenticated;

