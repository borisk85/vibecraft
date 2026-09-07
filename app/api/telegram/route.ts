import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import {
  renderEmail,
  renderEmailText,
  textToParagraphs,
} from "@/lib/email-layout";
import { notifyFailure } from "@/lib/notify-failure";

/*
  Ответ клиенту прямо из Telegram.

  Boris делает reply на заявку и пишет ответ в свободной форме («созвон в
  четверг, спроси про интеграцию с 1С»). Бот собирает из этого письмо на «вы»
  и показывает черновик с кнопкой. Письмо уходит клиенту после нажатия кнопки.
  Правки вносятся тем же reply на черновик — бот пересобирает текст с учетом
  замечаний и снова показывает черновик.

  Механика взята из vela-marketing-bot (workflows/reply_writer.py): входящее
  сообщение плюс подсказка от Boris, на выходе готовый текст.

  Переменные окружения:
    TELEGRAM_BOT_TOKEN      — тот же бот, что шлет заявки
    TELEGRAM_CHAT_ID        — личный чат, из других чатов запросы игнорируются
    TELEGRAM_WEBHOOK_SECRET — секрет из setWebhook, приходит заголовком
    ANTHROPIC_API_KEY, RESEND_API_KEY
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";

// Коды букв, запрещенных в текстах проекта: строчная и заглавная с точками.
const YO_LOWER = String.fromCharCode(1105);
const YO_UPPER = String.fromCharCode(1025);
const E_LOWER = String.fromCharCode(1077);
const E_UPPER = String.fromCharCode(1045);
const DASH = String.fromCharCode(8212);

type Draft = {
  to: string;
  name: string;
  handle: string;
  subject: string;
  title: string;
  body: string;
  original: string;
};

const SYSTEM_PROMPT = `Ты пишешь деловое письмо клиенту от лица Бориса Комарова, основателя Vibecraft (ИИ-разработка и автоматизации, Казахстан).

Вход: заявка клиента с сайта и ответ Бориса в свободной форме. Ответ Бориса это приказ по смыслу: что сказать, о чем спросить, что предложить. Твоя работа — развернуть его в письмо, а не переписать по-своему. Если дан прошлый вариант письма и замечания к нему, правь именно его, а не пиши заново.

ЖЕСТКИЕ ПРАВИЛА:
1. Обращение только на «вы» (вы, ваш, вам). Никакого «ты».
2. Никогда не используй букву «${E_LOWER}» с двумя точками сверху — вместо нее обычная «${E_LOWER}». Это касается всех слов: «все», «еще», «свое», «найдет», «счет».
3. Не выдумывай факты: сроки, цены, состав работ, гарантии, встречи. Пиши только то, что есть в ответе Бориса или в заявке. Если о чем-то не сказано — не додумывай.
4. Никаких «вайб-кодинг», «vibe coding». О технологии говори как «ИИ-разработка» или «разработка с Claude».
5. Длина 100-250 слов. Это письмо, а не лендинг.
6. Без markdown: ни звездочек, ни решеток, ни списков через дефис. Обычные абзацы, разделенные пустой строкой.
7. ПРАВИЛО ТИРЕ. Длинное тире «${DASH}» это главный маркер ИИ-текста. В письме его в идеале ноль. Прежде чем поставить, ищи замену: запятая, двоеточие, точка, скобки. Оставляй только там, где замены нет: определение вида «X ${DASH} Y» без глагола-связки. Перед выдачей перечитай текст и сними лишние тире.
8. ЗАПРЕЩЕННЫЕ КЛИШЕ. Не пиши: «надеюсь, это письмо застало вас в добром здравии», «рад приветствовать», «спасибо за проявленный интерес», «мы ценим ваше время», «не стесняйтесь обращаться», «с нетерпением жду вашего ответа», «в кратчайшие сроки», «индивидуальный подход», «команда профессионалов», «широкий спектр услуг», «оптимальное решение», «в рамках», «осуществляем», «направляем вам», «данный», «является». Пиши так, как пишет человек, который прочитал заявку и отвечает по делу.
9. Тон деловой и спокойный. Без пафоса, без продающих лозунгов, без шуток и без восклицательных знаков.
10. Начинай с обращения по имени, если имя есть в заявке.
11. Заканчивай конкретным следующим шагом из ответа Бориса (вопрос, предложение созвона, просьба прислать детали). Подпись не пиши: она добавляется шаблоном автоматически.

ВОЗВРАЩАЙ ТОЛЬКО валидный JSON:

{
  "subject": "тема письма, 4-8 слов, конкретно по задаче клиента, без слов «предложение» и «коммерческое»",
  "title": "короткая строка предпросмотра письма",
  "body": "текст письма, абзацы разделены пустой строкой"
}

Правила JSON: все строки в двойных кавычках, переносы строк как \\n, никаких обратных кавычек, никаких блоков кода, ничего до и после JSON.`;

function stripYo(value: string): string {
  return value.split(YO_LOWER).join(E_LOWER).split(YO_UPPER).join(E_UPPER);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeJson(raw: string): string {
  const text = raw.trim();
  if (text.startsWith("```")) {
    return text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return text;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0] : null;
}

function extractName(text: string): string {
  const match = text.match(/Имя:\s*(.+)/);
  return match ? match[1].trim() : "";
}

async function telegram(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as { ok: boolean; result?: { message_id: number } };
}

function sendMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown,
  replyTo?: number,
) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
    reply_to_message_id: replyTo,
  });
}

function keyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Отправить", callback_data: "send" },
        { text: "Редактировать", callback_data: "edit" },
      ],
    ],
  };
}

function extractTelegramHandle(text: string): string {
  // @username ищем только там, где перед ним нет символов адреса почты,
  // иначе из bkomarov85@gmail.com выдиралось «@gmail».
  const match = text.match(/(?:^|[\s(:,])@([A-Za-z0-9_]{5,32})\b/);
  return match ? match[1] : "";
}

/** Черновик читается обратно из текста сообщения: внешнее хранилище не нужно. */
function parseDraftMessage(text: string): { to: string; handle: string; subject: string; body: string } | null {
  const to = text.match(/Кому:\s*(\S+)/);
  const subject = text.match(/Тема:\s*(.+)/);
  if (!to || !subject) return null;
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("Тема:")) + 1;
  const end = lines.findIndex((l) => l.startsWith("Правки:"));
  const body = lines
    .slice(start, end === -1 ? undefined : end)
    .join("\n")
    .trim();
  if (!body) return null;
  const handle = text.match(/Telegram:\s*@(\S+)/);
  return {
    to: to[1].trim(),
    handle: handle ? handle[1].trim() : "",
    subject: subject[1].trim(),
    body,
  };
}

function draftMessage(draft: Draft): string {
  return [
    `<b>Черновик письма${draft.name ? ` ${draft.name}` : ""}</b>`,
    `<b>Кому:</b> ${escapeHtml(draft.to)}`,
    draft.handle ? `<b>Telegram:</b> @${escapeHtml(draft.handle)}` : "",
    `<b>Тема:</b> ${escapeHtml(draft.subject)}`,
    "",
    escapeHtml(draft.body),
    "",
    "<i>Правки: reply на это сообщение с тем, что изменить.</i>",
  ].join("\n");
}

async function buildDraft(
  original: string,
  hint: string,
  previous?: Draft,
): Promise<{ subject: string; title: string; body: string }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const hintBlock = previous
    ? `\n\n=== ПРОШЛЫЙ ВАРИАНТ ПИСЬМА (правь его) ===\nТема: ${previous.subject}\n\n${previous.body}\n\n=== ЗАМЕЧАНИЯ БОРИСА К ЭТОМУ ВАРИАНТУ ===\n${hint}`
    : `\n\n=== ОТВЕТ БОРИСА (на его основе пишется письмо) ===\n${hint}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `=== ЗАЯВКА КЛИЕНТА С САЙТА ===\n${original}${hintBlock}\n\nНапиши письмо клиенту. Верни только JSON.`,
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = JSON.parse(normalizeJson(raw)) as {
    subject?: string;
    title?: string;
    body?: string;
  };

  const subject = stripYo((parsed.subject ?? "").trim());
  const title = stripYo((parsed.title ?? subject).trim());
  const body = stripYo((parsed.body ?? "").trim());

  if (!subject || !body) throw new Error("Claude вернул пустое письмо");
  return { subject, title, body };
}

async function sendLetter(draft: Draft) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const sent = await resend.emails.send({
    from: "Vibecraft <hello@vibecraft.kz>",
    to: draft.to,
    replyTo: "hello@vibecraft.kz",
    subject: draft.subject,
    html: renderEmail({
      title: draft.title,
      bodyHtml: textToParagraphs(draft.body),
      preheader: draft.body.slice(0, 120),
    }),
    text: renderEmailText(draft.title, draft.body),
  });
  if (sent.error) throw new Error(sent.error.message);
  return sent.data?.id ?? "";
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: true, stage: "bad-secret" });
  }

  const ownerChatId = process.env.TELEGRAM_CHAT_ID ?? "";
  let chatId: number | string = ownerChatId;
  let step = "start";

  try {
    const update = await req.json();

    // Нажатие кнопки под черновиком.
    const callback = update?.callback_query;
    if (callback) {
      chatId = callback.message?.chat?.id ?? ownerChatId;
      const action = String(callback.data ?? "");
      await telegram("answerCallbackQuery", { callback_query_id: callback.id });

      if (String(chatId) !== String(ownerChatId)) {
        return NextResponse.json({ ok: true, stage: "foreign-chat" });
      }

      await telegram("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: callback.message.message_id,
        reply_markup: { inline_keyboard: [] },
      });

      if (action === "edit") {
        await sendMessage(
          chatId,
          "Сделай reply на черновик и напиши, что поменять. Пришлю новый вариант с кнопками.",
        );
        return NextResponse.json({ ok: true, stage: "edit" });
      }

      if (action === "hold") {
        await sendMessage(chatId, "Письмо не отправлено. Черновик остался в чате, reply на него внесет правки.");
        return NextResponse.json({ ok: true, stage: "hold" });
      }

      if (action === "send") {
        const parsed = parseDraftMessage(String(callback.message?.text ?? ""));
        if (!parsed) {
          await sendMessage(chatId, "Не разобрал черновик. Сделай reply на заявку заново.");
          return NextResponse.json({ ok: true, stage: "parse-failed" });
        }
        step = "resend";
        const id = await sendLetter({
          to: parsed.to,
          name: "",
          handle: "",
          subject: parsed.subject,
          title: parsed.subject,
          body: parsed.body,
          original: "",
        });
        const lines = [
          `Письмо отправлено на ${escapeHtml(parsed.to)} с hello@vibecraft.kz`,
        ];
        if (id) lines.push(`ID письма: <code>${id}</code>`);
        // Написать первым в Telegram бот не может, это запрет самого Telegram,
        // поэтому для указанного в заявке @username даем ссылку на чат.
        if (parsed.handle) {
          lines.push(
            `Клиент оставил Telegram: <a href="https://t.me/${parsed.handle}">@${parsed.handle}</a> — текст письма выше можно продублировать ему туда.`,
          );
        }
        await sendMessage(chatId, lines.join("\n"));
      }

      return NextResponse.json({ ok: true, stage: "sent" });
    }

    const message = update?.message;
    if (!message?.text) return NextResponse.json({ ok: true, stage: "no-text" });

    chatId = message.chat?.id ?? ownerChatId;
    if (String(chatId) !== String(ownerChatId)) {
      return NextResponse.json({ ok: true, stage: "foreign-chat" });
    }

    const hint = String(message.text).trim();
    const repliedTo = message.reply_to_message;
    if (!repliedTo?.text) {
      await sendMessage(
        chatId,
        "Сделай reply на сообщение с заявкой и напиши, что ответить клиенту.",
      );
      return NextResponse.json({ ok: true, stage: "no-reply" });
    }

    // Reply приходит либо на заявку, либо на черновик. У черновика в чате есть
    // своя ссылка на заявку, поэтому исходный текст всегда доступен без базы.
    const isDraft = repliedTo.text.startsWith("Черновик письма");
    const previousDraft = isDraft ? parseDraftMessage(repliedTo.text) : null;
    const original = isDraft
      ? String(repliedTo.reply_to_message?.text ?? "").trim()
      : String(repliedTo.text).trim();

    const to = previousDraft ? previousDraft.to : extractEmail(original);
    if (!to) {
      await sendMessage(
        chatId,
        "В заявке нет email — письмом не ответить. Пиши клиенту в Telegram.",
      );
      return NextResponse.json({ ok: true, stage: "no-email" });
    }

    if (!process.env.ANTHROPIC_API_KEY || !process.env.RESEND_API_KEY) {
      await sendMessage(chatId, "Не задан ANTHROPIC_API_KEY или RESEND_API_KEY.");
      return NextResponse.json({ ok: true, stage: "no-keys" });
    }

    step = "claude";
    const built = await buildDraft(
      original,
      hint,
      previousDraft
        ? {
            to,
            name: "",
            handle: previousDraft.handle,
            subject: previousDraft.subject,
            title: previousDraft.subject,
            body: previousDraft.body,
            original,
          }
        : undefined,
    );

    const draft: Draft = {
      to,
      name: extractName(original),
      handle: previousDraft ? previousDraft.handle : extractTelegramHandle(original),
      original,
      ...built,
    };

    step = "telegram-send";
    await sendMessage(
      chatId,
      draftMessage(draft),
      keyboard(),
      isDraft ? repliedTo.reply_to_message?.message_id : repliedTo.message_id,
    );

    return NextResponse.json({ ok: true, stage: "draft-sent" });
  } catch (error) {
    console.error("[telegram]", error);
    // Ответ видит только Telegram и запросы с секретом, поэтому текст ошибки
    // здесь безопасен и экономит час разбора логов при поломке.
    const reason = error instanceof Error ? error.message : String(error);
    await notifyFailure("ответ клиенту из Telegram", error);
    if (chatId) {
      await sendMessage(
        chatId,
        `Не получилось собрать или отправить письмо: ${escapeHtml(reason)}`,
      );
    }
    return NextResponse.json({ ok: true, step, error: reason });
  }
}
