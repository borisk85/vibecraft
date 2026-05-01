import { NextResponse } from "next/server";

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 100);
    const email = String(body.email ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 3000);

    if (!email || !message) {
      return NextResponse.json({ error: "Email и сообщение обязательны" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      const lines = [
        "📩 <b>Вопрос с сайта — Vibecraft</b>",
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
