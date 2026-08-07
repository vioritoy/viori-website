-- Страница, которая открывается после сканирования NFC-чипа.
--
-- Чип содержит публичный код (public_code), а не одноразовый код активации:
-- иначе любой, кто взял игрушку в руки, мог бы привязать её к себе.
--
-- Политика passports_owner_read отдаёт паспорт только владельцу, поэтому
-- незалогиненный человек не видел даже имени персонажа. Эта функция отдаёт
-- ровно три безопасных поля и ничего больше: ни владельца, ни воспоминаний,
-- ни кода активации.

create or replace function public.passport_preview(code text)
returns table(character_name_ru text, character_name_en text, is_activated boolean)
language sql security definer stable set search_path = '' as $$
  select
    p.character_name_ru,
    p.character_name_en,
    p.status in ('claimed', 'transferred')
  from public.nfc_passports p
  where p.public_code = upper(trim(code))
  limit 1;
$$;

revoke all on function public.passport_preview(text) from public;
grant execute on function public.passport_preview(text) to anon, authenticated;
