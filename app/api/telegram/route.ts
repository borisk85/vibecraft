import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";
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
    KV_REST_API_URL / KV_REST_API_TOKEN — хранение черновика до нажатия кнопки
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 3;

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

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
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
) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

function keyboard(key: string, handle: string) {
  const row: Record<string, string>[] = [
    { text: "Отправить на почту", callback_data: `send:${key}` },
  ];
  // Бот не может писать первым незнакомому человеку: Telegram это запрещает.
  // Поэтому для указанного в заявке @username даем ссылку на чат.
  if (handle) {
    row.push({
      text: "Написать в Telegram",
      url: `https://t.me/${handle.replace("@", "")}`,
    });
  }
  return {
    inline_keyboard: [row, [{ text: "Пока не слать", callback_data: `hold:${key}` }]],
  };
}

function extractTelegramHandle(text: string): string {
  const match = text.match(/@([A-Za-z0-9_]{4,32})/);
  return match ? match[1] : "";
}

function draftMessage(draft: Draft): string {
  return [
    `<b>Черновик письма${draft.name ? ` ${draft.name}` : ""}</b>`,
    `<b>Кому:</b> ${escapeHtml(draft.to)}`,
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
    headers: {
      "List-Unsubscribe": "<mailto:hello@vibecraft.kz?subject=unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (sent.error) throw new Error(sent.error.message);
  return sent.data?.id ?? "";
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: true });
  }

  const ownerChatId = process.env.TELEGRAM_CHAT_ID ?? "";
  let chatId: number | string = ownerChatId;

  try {
    const update = await req.json();
    const redis = getRedis();

    // Нажатие кнопки под черновиком.
    const callback = update?.callback_query;
    if (callback) {
      chatId = callback.message?.chat?.id ?? ownerChatId;
      const [action, key] = String(callback.data ?? "").split(":");
      await telegram("answerCallbackQuery", { callback_query_id: callback.id });

      if (String(chatId) !== String(ownerChatId)) {
        return NextResponse.json({ ok: true });
      }

      if (action === "hold") {
        await telegram("editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: { inline_keyboard: [] },
        });
        await sendMessage(
          chatId,
          "Письмо не отправлено. Черновик живет три дня, reply на него вернет кнопку.",
        );
        return NextResponse.json({ ok: true });
      }

      if (action === "send") {
        const draft = redis ? await redis.get<Draft>(`draft:${key}`) : null;
        if (!draft) {
          await sendMessage(
            chatId,
            "Черновик не найден, он хранится три дня. Сделай reply на заявку заново.",
          );
          return NextResponse.json({ ok: true });
        }

        const id = await sendLetter(draft);
        await telegram("editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: { inline_keyboard: [] },
        });
        await sendMessage(
          chatId,
          `Письмо отправлено на ${escapeHtml(draft.to)} с hello@vibecraft.kz${id ? `\nID письма: <code>${id}</code>` : ""}`,
        );
      }

      return NextResponse.json({ ok: true });
    }

    const message = update?.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    chatId = message.chat?.id ?? ownerChatId;
    if (String(chatId) !== String(ownerChatId)) {
      return NextResponse.json({ ok: true });
    }

    const hint = String(message.text).trim();
    const repliedTo = message.reply_to_message;
    if (!repliedTo?.text) {
      await sendMessage(
        chatId,
        "Сделай reply на сообщение с заявкой и напиши, что ответить клиенту.",
      );
      return NextResponse.json({ ok: true });
    }

    // Reply приходит либо на заявку, либо на уже готовый черновик: во втором
    // случае берем ту же заявку и правим прошлый текст.
    const previous = redis
      ? await redis.get<Draft>(`draft:${repliedTo.message_id}`)
      : null;
    const original = previous ? previous.original : String(repliedTo.text).trim();

    const to = previous ? previous.to : extractEmail(original);
    if (!to) {
      await sendMessage(
        chatId,
        "В заявке нет email — письмом не ответить. Пиши клиенту в Telegram.",
      );
      return NextResponse.json({ ok: true });
    }

    if (!process.env.ANTHROPIC_API_KEY || !process.env.RESEND_API_KEY) {
      await sendMessage(chatId, "Не задан ANTHROPIC_API_KEY или RESEND_API_KEY.");
      return NextResponse.json({ ok: true });
    }

    if (!redis) {
      await sendMessage(
        chatId,
        "Не настроено хранилище черновиков (KV_REST_API_URL), кнопка отправки работать не будет.",
      );
      return NextResponse.json({ ok: true });
    }

    const built = await buildDraft(original, hint, previous ?? undefined);
    const draft: Draft = {
      to,
      name: previous ? previous.name : extractName(original),
      handle: previous ? previous.handle : extractTelegramHandle(original),
      original,
      ...built,
    };

    const sentDraft = await sendMessage(
      chatId,
      draftMessage(draft),
      keyboard("pending", draft.handle),
    );

    const draftMessageId = sentDraft?.result?.message_id;
    if (draftMessageId) {
      await redis.set(`draft:${draftMessageId}`, draft, {
        ex: DRAFT_TTL_SECONDS,
      });
      // Ключ черновика это id сообщения, он известен только после отправки.
      await telegram("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: draftMessageId,
        reply_markup: keyboard(String(draftMessageId), draft.handle),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram]", error);
    await notifyFailure("ответ клиенту из Telegram", error);
    if (chatId) {
      await sendMessage(
        chatId,
        "Не получилось собрать или отправить письмо. Подробности в логах Vercel.",
      );
    }
    return NextResponse.json({ ok: true });
  }
}
