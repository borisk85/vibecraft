import { NextResponse } from "next/server";
import crypto from "crypto";

/*
  Судьба отправленного письма приходит в Telegram сама.

  Класс ошибки: письмо клиенту уходит с hello@vibecraft.kz, а попало оно во
  входящие или отбилось — видно только в панели Resend, куда никто не заходит.
  Домену меньше месяца, репутации у него нет, поэтому первые отказы важно
  увидеть сразу, а не через неделю молчания клиента.

  Resend шлет события вебхуком, подпись у него в формате Svix: HMAC-SHA256 от
  строки «id.timestamp.тело» ключом из secret после префикса whsec_.

  Сообщение приходит только на плохие исходы: отбой, жалоба на спам, задержка.
  На каждое доставленное письмо уведомление не шлем — это шум.

  Переменные окружения:
    RESEND_WEBHOOK_SECRET — из настроек вебхука в Resend, начинается с whsec_
    TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — тот же бот, что шлет заявки
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WATCHED: Record<string, string> = {
  "email.bounced": "Письмо не доставлено",
  "email.complained": "Клиент пометил письмо как спам",
  "email.delivery_delayed": "Письмо задерживается у почтового сервера",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Подпись Svix: заголовок несет список «v1,base64», сверяем без утечки времени. */
function verify(secret: string, headers: Headers, body: string): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  // Окно в 5 минут: перехваченный запрос нельзя переиграть через час.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  return signature.split(" ").some((part) => {
    const value = part.split(",")[1];
    if (!value || value.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  });
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await req.text();

  if (!secret || !verify(secret, req.headers, body)) {
    return NextResponse.json({ ok: true, stage: "bad-signature" });
  }

  const event = JSON.parse(body) as {
    type?: string;
    data?: { to?: string[] | string; subject?: string; email_id?: string };
  };

  const title = WATCHED[event.type ?? ""];
  if (!title) return NextResponse.json({ ok: true, stage: "ignored" });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ ok: true, stage: "no-keys" });

  const to = Array.isArray(event.data?.to)
    ? event.data.to.join(", ")
    : String(event.data?.to ?? "");

  const text = [
    `<b>${title}</b>`,
    "",
    `Кому: ${escapeHtml(to)}`,
    event.data?.subject ? `Тема: ${escapeHtml(event.data.subject)}` : "",
    event.data?.email_id ? `ID письма: <code>${event.data.email_id}</code>` : "",
    "",
    "Клиент ответа не увидел. Напиши ему в Telegram или с другой почты.",
  ]
    .filter(Boolean)
    .join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  return NextResponse.json({ ok: true, stage: "notified" });
}
