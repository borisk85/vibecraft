import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { renderEmail } from "@/lib/email-layout";

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
        const bodyHtml = `
  <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.65">Мы уже смотрим, обычно отвечаем в течение нескольких часов.</p>
  ${ticket ? `<p style="margin:0 0 24px 0;font-size:14px;color:#374151">Номер обращения: <strong style="color:#111827">#${ticket}</strong></p>` : ""}
  <div style="font-size:9px;font-weight:700;color:#8B5CF6;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Ваше сообщение</div>
  <div style="background:#fafafa;border-left:3px solid #8B5CF6;padding:12px 14px;font-size:13px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(message)}</div>`;

        const html = renderEmail({
          title: "Ваше обращение получено",
          bodyHtml,
          preheader: message.slice(0, 120),
        });
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
