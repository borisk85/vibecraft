import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Тот же Upstash-инстанс, что у калькулятора (KV_* или UPSTASH_* префиксы)
function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 100);
    const email = String(body.email ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 3000);

    if (!email || !message) {
      return NextResponse.json({ error: "Email и сообщение обязательны" }, { status: 400 });
    }

    // Номер обращения — счетчик в Upstash (стартует с #101).
    // Best-effort: без Redis флоу работает, просто без номера.
    let ticket: number | null = null;
    try {
      const redis = getRedis();
      if (redis) {
        await redis.set("support:ticket_counter", 100, { nx: true });
        ticket = await redis.incr("support:ticket_counter");
      }
    } catch (err) {
      console.error("[contact] ticket counter failed", err);
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      const lines = [
        `📩 <b>Вопрос с сайта — Vibecraft${ticket ? ` #${ticket}` : ""}</b>`,
        "",
        name ? `<b>Имя:</b> ${escapeHtml(name)}` : null,
        `<b>Email:</b> ${escapeHtml(email)}`,
        "",
        `<b>Сообщение:</b>\n${escapeHtml(message)}`,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4000);

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "HTML" }),
      });
    }

    // Автокопия юзеру — best-effort, не блокирует обращение
    if (resend) {
      try {
        const subject = ticket
          ? `Ваше обращение получено — Vibecraft (#${ticket})`
          : "Ваше обращение получено — Vibecraft";
        const html = `<div style="background:#ffffff;padding:40px 16px;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;text-align:left">
  <tr><td style="padding-bottom:12px">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.3">Ваше обращение получено</h1>
  </td></tr>
  <tr><td style="padding-bottom:20px">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.65">Мы уже смотрим — обычно отвечаем в течение нескольких часов.</p>
  </td></tr>
  ${ticket ? `<tr><td style="padding-bottom:24px"><p style="margin:0;font-size:14px;color:#374151">Номер обращения: <strong style="color:#111827">#${ticket}</strong></p></td></tr>` : ""}
  <tr><td style="padding-bottom:24px"><div style="height:1px;background:#E5E7EB"></div></td></tr>
  <tr><td style="padding-bottom:6px">
    <p style="margin:0;font-size:13px;font-weight:700;color:#111827">Ваше сообщение:</p>
  </td></tr>
  <tr><td style="padding-bottom:28px">
    <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.65;white-space:pre-wrap">${escapeHtml(message)}</p>
  </td></tr>
  <tr><td style="padding-bottom:20px"><div style="height:1px;background:#E5E7EB"></div></td></tr>
  <tr><td>
    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.65">Это письмо отправлено автоматически в ответ на ваше обращение с сайта vibecraft.kz.<br>Вопросы — <a href="mailto:hello@vibecraft.kz" style="color:#6B7280;text-decoration:none">hello@vibecraft.kz</a></p>
  </td></tr>
</table>
</td></tr></table>
</div>`;
        await resend.emails.send({
          from: "Vibecraft <noreply@vibecraft.kz>",
          to: email,
          replyTo: "hello@vibecraft.kz",
          subject,
          html,
        });
      } catch (err) {
        console.error("[contact] auto-copy failed", err);
      }
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
