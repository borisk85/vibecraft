import { NextResponse } from "next/server";

/*
  Прием feedback от чат-виджета. При нажатии thumbs up/down на ответ
  ИИ-консультанта шлет уведомление в Telegram владельца с вопросом
  клиента и ответом AI — чтобы видеть когда AI облажался или сработал
  хорошо, и подкручивать системный промпт.
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
    const rating =
      body.rating === "up" || body.rating === "down" ? body.rating : null;
    const userQuestion = String(body.userQuestion ?? "").slice(0, 1000);
    const assistantReply = String(body.assistantReply ?? "").slice(0, 2000);

    if (!rating || !assistantReply) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error(
        "[chat-feedback] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы",
      );
      return NextResponse.json(
        { error: "Channel not configured" },
        { status: 503 },
      );
    }

    const emoji = rating === "up" ? "\u{1F44D}" : "\u{1F44E}";
    const label = rating === "up" ? "лайк" : "дизлайк";

    const lines = [
      `${emoji} <b>ИИ-консультант: ${label}</b>`,
      "",
      userQuestion
        ? `<b>Вопрос клиента:</b>\n${escapeHtml(userQuestion)}\n`
        : null,
      `<b>Ответ AI:</b>\n${escapeHtml(assistantReply)}`,
    ];

    const text = lines.filter(Boolean).join("\n").slice(0, 4000);

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
      console.error("[chat-feedback] Telegram API error", err);
      return NextResponse.json({ error: "Telegram error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[chat-feedback] Unexpected error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
