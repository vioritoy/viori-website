-- Сказка на всех языках сайта, а не только RU и EN: игрушки покупают из
-- разных стран. Вместо колонки под каждый язык — один jsonb вида
-- {"ru": "...", "en": "...", "nl": "..."}. Добавить язык потом можно будет
-- без миграции.

alter table public.nfc_passports
  add column if not exists story jsonb not null default '{}'::jsonb;

-- Переносим то, что уже было написано, чтобы ничего не потерялось.
update public.nfc_passports
   set story = jsonb_strip_nulls(jsonb_build_object(
     'ru', nullif(story_ru, ''),
     'en', nullif(story_en, '')
   ))
 where story = '{}'::jsonb
   and (coalesce(story_ru, '') <> '' or coalesce(story_en, '') <> '');

alter table public.nfc_passports drop column if exists story_ru;
alter table public.nfc_passports drop column if exists story_en;

-- Набор колонок меняется, поэтому функцию пересоздаём.
drop function if exists public.passport_preview(text);

create function public.passport_preview(code text)
returns table(
  character_name_ru text,
  character_name_en text,
  is_activated boolean,
  story jsonb,
  photo_path text
)
language sql security definer stable set search_path = '' as $$
  select
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
