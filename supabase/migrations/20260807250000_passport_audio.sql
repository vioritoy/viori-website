-- Озвученная сказка отдельным файлом на каждый язык.
--
-- Синтез речи в браузере зависит от устройства клиента: где-то голос хороший,
-- где-то механический, где-то его нет вовсе. Готовый файл звучит одинаково у
-- всех и может быть начитан голосом мастера — для игрушки ручной работы это
-- ценнее любого синтеза.
--
-- Формат тот же, что у сказки: {"ru": "passports/<id>/story-ru.mp3", ...},
-- поэтому новый язык не требует миграции.

alter table public.nfc_passports
  add column if not exists audio jsonb not null default '{}'::jsonb;

drop function if exists public.passport_preview(text);

create function public.passport_preview(code text)
returns table(
  owner_name text,
  character_name_ru text,
  character_name_en text,
  is_activated boolean,
  story jsonb,
  audio jsonb,
  photo_path text
)
language sql security definer stable set search_path = '' as $$
  select
    p.owner_name,
    p.character_name_ru,
    p.character_name_en,
    p.status in ('claimed', 'transferred'),
    p.story,
    p.audio,
    p.photo_path
  from public.nfc_passports p
  where p.public_code = upper(trim(code))
  limit 1;
$$;

revoke all on function public.passport_preview(text) from public;
grant execute on function public.passport_preview(text) to anon, authenticated;
