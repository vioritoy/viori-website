// Письмо клиенту при смене статуса заказа.
//
// Вызывается Database Webhook на UPDATE public.orders. Письмо уходит только
// если статус действительно изменился — обновление адреса или суммы письмо
// не порождает.
//
// Обязательные секреты (supabase secrets set ...):
//   RESEND_API_KEY   — ключ провайдера рассылки
//   ORDER_EMAIL_FROM — отправитель, например "VIORI <orders@ваш-домен.nl>"
// Необязательный:
//   ORDER_EMAIL_WEBHOOK_SECRET — если задан, запрос обязан прислать тот же
//   заголовок x-webhook-secret; иначе функция отвечает 401.

interface OrderRecord {
  id: string;
  order_number: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  total_cents: number;
  delivery_method?: string | null;
}

interface WebhookPayload {
  type: string;
  record: OrderRecord | null;
  old_record: OrderRecord | null;
}

// Статусы, о которых клиенту сообщаем. "new" не шлём: он выставляется
// при создании заказа, а не при смене.
const STATUS_COPY: Record<string, { ru: [string, string]; en: [string, string] }> = {
  paid: {
    ru: ["Оплата получена", "Мы получили оплату и передаём заказ в работу."],
    en: ["Payment received", "We have received your payment and are starting work on your order."]
  },
  making: {
    ru: ["Игрушка создаётся", "Мастер начал вязать вашего персонажа. Это самая долгая часть пути."],
    en: ["Your toy is being made", "Our maker has started crocheting your character. This is the longest part of the journey."]
  },
  shipped: {
    ru: ["Заказ отправлен", "Посылка в пути. Когда игрушка приедет, активируйте её NFC-паспорт."],
    en: ["Your order has shipped", "The parcel is on its way. When it arrives, activate the NFC passport."]
  },
  completed: {
    ru: ["Заказ завершён", "Спасибо, что выбрали VIORI. История вашего персонажа только начинается."],
    en: ["Order completed", "Thank you for choosing VIORI. Your character's story is just beginning."]
  },
  cancelled: {
    ru: ["Заказ отменён", "Заказ отменён. Если это ошибка — просто ответьте на это письмо."],
    en: ["Order cancelled", "Your order has been cancelled. If this is a mistake, just reply to this email."]
  }
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char
  ));
}

// Язык клиента нигде не хранится, поэтому письмо двуязычное: русский и
// английский. Так его поймёт и покупатель из Нидерландов.
function buildHtml(order: OrderRecord, copy: typeof STATUS_COPY[string]): string {
  const name = escapeHtml(order.customer_name || "");
  const number = escapeHtml(order.order_number);
  const total = (order.total_cents / 100).toFixed(2);
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f7eee6;font-family:Arial,Helvetica,sans-serif;color:#3f2a1e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fffaf6;border-radius:18px;padding:32px">
    <tr><td>
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8c5234">VIORI</p>
      <h1 style="margin:0 0 18px;font-size:24px">${escapeHtml(copy.ru[0])}</h1>
      <p style="margin:0 0 14px;line-height:1.6">${name ? `${name}, ` : ""}${escapeHtml(copy.ru[1])}</p>
      <p style="margin:0 0 22px;line-height:1.6;color:#7d6657">Заказ <strong>${number}</strong> · €${total}</p>
      <hr style="border:0;border-top:1px solid rgba(114,77,52,.16);margin:0 0 22px">
      <h2 style="margin:0 0 12px;font-size:18px">${escapeHtml(copy.en[0])}</h2>
      <p style="margin:0 0 14px;line-height:1.6">${escapeHtml(copy.en[1])}</p>
      <p style="margin:0 0 22px;line-height:1.6;color:#7d6657">Order <strong>${number}</strong> · €${total}</p>
      <p style="margin:0;font-size:12px;color:#7d6657">VIORI · handmade crochet toys</p>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  const expectedSecret = Deno.env.get("ORDER_EMAIL_WEBHOOK_SECRET");
  if (expectedSecret && request.headers.get("x-webhook-secret") !== expectedSecret) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  const order = payload.record;
  const previous = payload.old_record;
  if (!order) return new Response("no record", { status: 200 });

  // Статус не менялся — письмо не нужно.
  if (previous && previous.status === order.status) {
    return new Response(JSON.stringify({ skipped: "status unchanged" }), { status: 200 });
  }

  const copy = STATUS_COPY[order.status];
  if (!copy) {
    return new Response(JSON.stringify({ skipped: `no template for ${order.status}` }), { status: 200 });
  }
  if (!order.customer_email) {
    return new Response(JSON.stringify({ skipped: "order has no email" }), { status: 200 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ORDER_EMAIL_FROM");
  if (!apiKey || !from) {
    console.error("RESEND_API_KEY or ORDER_EMAIL_FROM is not set");
    return new Response("email is not configured", { status: 500 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [order.customer_email],
      subject: `${copy.ru[0]} · ${order.order_number}`,
      html: buildHtml(order, copy)
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend rejected the message:", response.status, detail);
    return new Response(detail, { status: 502 });
  }

  return new Response(JSON.stringify({ sent: order.order_number, status: order.status }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
