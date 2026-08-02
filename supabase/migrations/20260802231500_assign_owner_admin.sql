-- VIORI owner account. The role is assigned only by trusted database code.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    case
      when lower(new.email) = 'viktoriasulima1@gmail.com' then 'admin'::public.user_role
      else 'customer'::public.user_role
    end
  );
  return new;
end;
$$;

update public.profiles p
   set role = 'admin', updated_at = now()
  from auth.users u
 where p.id = u.id
   and lower(u.email) = 'viktoriasulima1@gmail.com';

