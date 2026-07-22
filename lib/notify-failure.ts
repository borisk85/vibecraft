/**
 * Уведомление в Telegram, когда лидогенерирующий endpoint падает.
 *
 * Класс ошибки (22.07.2026): база Upstash для rate limit была удалена 25 мая,
 * калькулятор отдавал 500 на каждый запрос — и так 59 дней. Никто не узнал,
 * потому что об успешном расчете уведомление приходит, а об ошибке нет.
 *
 * Чтобы одна и та же поломка не завалила чат сотней сообщений, шлем не чаще
 * раза в час на инстанс. Serverless-инстансов может быть несколько, поэтому
 * это грубый предохранитель, а не точный счетчик: пары сообщений в час
 * достаточно, чтобы заметить, и мало, чтобы надоесть.
 */

const HOUR_MS = 60 * 60 * 1000;
const lastSentAt = new Map<string, number>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyFailure(
  source: string,
  error: unknown,
): Promise<void> {
  try {
    const now = Date.now();
    const previous = lastSentAt.get(source) ?? 0;
    if (now - previous < HOUR_MS) return;
    lastSentAt.set(source, now);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const details =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    const text = [
      `<b>Сломался ${escapeHtml(source)} на vibecraft.kz</b>`,
      "",
      "Клиент получил ошибку вместо результата. Заявки с этого места сейчас теряются.",
      "",
      `<code>${escapeHtml(details.slice(0, 500))}</code>`,
      "",
      "Следующее уведомление по этой же поломке придет не раньше чем через час.",
    ].join("\n");

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
  } catch (e) {
    console.error("[notify-failure] не смог отправить уведомление", e);
  }
}
