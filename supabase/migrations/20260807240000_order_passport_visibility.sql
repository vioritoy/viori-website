-- Клиент видит паспорт, выпущенный для его заказа, ещё до активации.
--
-- Раньше политика отдавала паспорт только владельцу, а владелец появляется
-- лишь после ввода кода с карточки. Получалось, что заказ выполнен, паспорт
-- выпущен и привязан к заказу, а в кабинете пусто и без объяснений.
--
-- Право на активацию это не даёт: owner_id по-прежнему проставляет только
-- claim_nfc_passport по коду, то есть тому, у кого игрушка в руках.

drop policy if exists "passports_order_owner_read" on public.nfc_passports;
create policy "passports_order_owner_read" on public.nfc_passports
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
