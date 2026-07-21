import { NextResponse } from "next/server";

/*
  Прием заявок с формы FinalCTA. Шлет сообщение в личный Telegram-чат
  владельца через Bot API (HTML parse_mode, пользовательский ввод
  экранируется).

  Переменные окружения (см. .env.example):
    TELEGRAM_BOT_TOKEN — токен бота, созданного через @BotFather
    TELEGRAM_CHAT_ID   — ID личного чата, куда слать заявки
*/

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").slice(0, 200);
    const contact = String(body.contact ?? "").slice(0, 200);
    const type = String(body.type ?? "").slice(0, 200);
    const budget = String(body.budget ?? "").slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 2000);

    if (!name || !contact || !message) {
      return NextResponse.json(
        { error: "Имя, контакт и описание задачи обязательны" },
        { status: 400 },
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("[lead] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы");
      return NextResponse.json(
        { error: "Канал приема заявок не настроен" },
        { status: 503 },
      );
    }

    const lines = [
      "<b>Новая заявка — vibecraft.kz</b>",
      "",
      `<b>Имя:</b> ${escapeHtml(name)}`,
      `<b>Контакт:</b> ${escapeHtml(contact)}`,
      type ? `<b>Тип:</b> ${escapeHtml(type)}` : null,
      budget ? `<b>Бюджет:</b> ${escapeHtml(budget)}` : null,
      message ? `\n<b>Задача:</b>\n${escapeHtml(message)}` : null,
    ];

    const text = lines.filter(Boolean).join("\n");

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[lead] Telegram API error", err);
      return NextResponse.json({ error: "Telegram error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lead] Unexpected error", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка" },
      { status: 500 },
    );
  }
}
