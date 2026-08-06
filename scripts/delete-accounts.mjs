// Одноразова адмін-операція: видаляє ВСІ облікові записи з auth.users.
//
// Запуск:
//   node scripts/delete-accounts.mjs            — сухий прогін, лише показує, кого видалить
//   node scripts/delete-accounts.mjs --confirm   — реально видаляє
//   node scripts/delete-accounts.mjs --confirm --keep-admin
//
// Потрібен .env (він у .gitignore) з двома рядками:
//   SUPABASE_URL=https://qathmhkogycyupaszsqn.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
//
// service_role key: Dashboard -> Project Settings -> API -> service_role.
// Цей ключ обходить RLS. Ніколи не комітьте його і не кладіть у config.js.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ADMIN_EMAIL = "viktoriasulima1@gmail.com";

function loadEnv() {
  let raw;
  try {
    raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  } catch {
    console.error("Немає файлу .env поруч з package.json. Створіть його з SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("У .env бракує SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (serviceKey.includes("YOUR_") || serviceKey.length < 40) {
  console.error("SUPABASE_SERVICE_ROLE_KEY виглядає як заглушка. Вставте справжній ключ.");
  process.exit(1);
}

const confirmed = process.argv.includes("--confirm");
const keepAdmin = process.argv.includes("--keep-admin");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// 1. Зібрати всіх користувачів (Admin API віддає сторінками).
const users = [];
for (let page = 1; ; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Не вдалося отримати список користувачів:", error.message);
    process.exit(1);
  }
  users.push(...data.users);
  if (data.users.length < 200) break;
}

const targets = keepAdmin
  ? users.filter((user) => (user.email || "").toLowerCase() !== ADMIN_EMAIL)
  : users;

console.log(`Усього акаунтів: ${users.length}. До видалення: ${targets.length}.`);
for (const user of targets) console.log(`  - ${user.email || "(без email)"}  ${user.id}`);

if (!targets.length) {
  console.log("Видаляти нічого.");
  process.exit(0);
}
if (!confirmed) {
  console.log("\nСухий прогін. Нічого не видалено. Додайте --confirm, щоб виконати.");
  process.exit(0);
}

// 2. Видалити. profiles, toy_memories і passport_transfers підуть каскадом.
let removed = 0;
for (const user of targets) {
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) console.error(`  помилка ${user.email}: ${error.message}`);
  else removed += 1;
}
console.log(`Видалено акаунтів: ${removed} із ${targets.length}.`);

// 3. Паспорти лишаються з owner_id = null, але зі старим статусом.
//    Без цього скидання власник не зможе активувати їх заново.
const { data: reset, error: resetError } = await supabase
  .from("nfc_passports")
  .update({ status: "issued", claimed_at: null })
  .is("owner_id", null)
  .neq("status", "issued")
  .select("id");

if (resetError) console.error("Не вдалося скинути статуси паспортів:", resetError.message);
else console.log(`Скинуто NFC-паспортів у статус issued: ${reset?.length ?? 0}.`);
