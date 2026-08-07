-- Первая глава истории персонажа и его фотография.
-- Их пишет мастер при выпуске паспорта; владелец потом продолжает историю
-- своими воспоминаниями в toy_memories.

alter table public.nfc_passports
  add column if not exists story_ru text not null default '',
  add column if not exists story_en text not null default '',
  add column if not exists photo_path text;

-- Возвращаемый набор меняется, поэтому функцию нужно пересоздать:
-- create or replace не умеет менять тип результата.
drop function if exists public.passport_preview(text);

create function public.passport_preview(code text)
returns table(
  character_name_ru text,
  character_name_en text,
  is_activated boolean,
  story_ru text,
  story_en text,
  photo_path text
)
language sql security definer stable set search_path = '' as $$
  select
    p.character_name_ru,
    p.character_name_en,
    p.status in ('claimed', 'transferred'),
    p.story_ru,
    p.story_en,
    p.photo_path
  from public.nfc_passports p
  where p.public_code = upper(trim(code))
  limit 1;
$$;

revoke all on function public.passport_preview(text) from public;
grant execute on function public.passport_preview(text) to anon, authenticated;
