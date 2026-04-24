import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { waitUntil } from "@vercel/functions";
import { CALCULATOR_SYSTEM_PROMPT } from "@/lib/calculator-system-prompt";
import { generateCalculatorPdfBuffer } from "@/lib/calculator-pdf";
import { stripUpsells } from "@/lib/strip-upsells";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Серверный rate limit: 5 расчетов в час с одного IP.
// Vercel при подключении Upstash через Marketplace создает env с префиксом
// KV_* (KV_REST_API_URL, KV_REST_API_TOKEN). Для совместимости проверяем
// оба варианта префикса. Если ничего не настроено — graceful degradation.
function buildRatelimit(): Ratelimit | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  console.log("[calculator] ratelimit init", {
    hasUrl: Boolean(url),
    hasToken: Boolean(token),
    urlPrefix: url ? url.slice(0, 30) : null,
  });

  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "vibecraft:calc",
    analytics: true,
  });
}

const ratelimit = buildRatelimit();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function buildSubject(description: string): string {
  const cleaned = description.replace(/\s+/g, " ").trim();
  const short = cleaned.length > 60 ? cleaned.slice(0, 60).trim() + "…" : cleaned;
  return `Ваша смета по проекту «${short}»`;
}

async function sendEmailToClient(
  email: string,
  description: string,
  clientSmeta: string,
) {
  if (!resend) {
    console.warn("[calculator] RESEND_API_KEY missing — email skipped");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0a0a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px 32px 40px 32px;">
    <div style="display:flex;align-items:center;gap:10px;border-bottom:1px solid #e5e5e5;padding-bottom:16px;margin-bottom:24px;">
      <img src="https://vibecraft.kz/icon" alt="Vibecraft" width="32" height="32" style="display:block;border-radius:6px;" />
      <div>
        <div style="font-size:20px;font-weight:700;letter-spacing:-0.4px;color:#0a0a0a;line-height:1;">vibecraft</div>
        <div style="font-size:11px;color:#5a5a5a;margin-top:4px;">AI-разработка и автоматизации · Казахстан</div>
      </div>
    </div>

    <h1 style="font-size:22px;font-weight:700;margin:0 0 8px 0;letter-spacing:-0.4px;">Ваша смета по проекту</h1>
    <p style="font-size:13px;color:#5a5a5a;margin:0 0 24px 0;">Спасибо что воспользовались калькулятором на сайте Vibecraft. Ниже — ориентировочный расчет стоимости вашей задачи.</p>

    <div style="font-size:9px;font-weight:700;color:#8B5CF6;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Описание задачи</div>
    <div style="background:#fafafa;border-left:3px solid #8B5CF6;padding:12px 14px;margin-bottom:24px;font-size:13px;line-height:1.5;">${escapeHtml(description)}</div>

    <div style="font-size:9px;font-weight:700;color:#8B5CF6;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Расчет</div>
    <pre style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;line-height:1.6;white-space:pre-wrap;margin:0 0 24px 0;color:#0a0a0a;">${escapeHtml(clientSmeta)}</pre>

    <div style="background:#f5f0ff;padding:14px;border-radius:6px;font-size:13px;line-height:1.5;margin-bottom:24px;">
      <strong>Готовы обсудить?</strong> Напишите мне в Telegram на <a href="https://t.me/borisk85" style="color:#8B5CF6;text-decoration:none;font-weight:700;">@borisk85</a> — отвечу в течении 1-2 часа в рабочее время.
    </div>

    <div style="border-top:1px solid #e5e5e5;padding-top:16px;font-size:11px;color:#5a5a5a;">
      <div style="margin-bottom:8px;"><strong style="color:#0a0a0a;">Vibecraft</strong> — AI-разработка и автоматизации · Казахстан</div>
      <div>Telegram: <a href="https://t.me/borisk85" style="color:#8B5CF6;text-decoration:none;">@borisk85</a> · Email: hello@vibecraft.kz · Сайт: <a href="https://vibecraft.kz" style="color:#8B5CF6;text-decoration:none;">vibecraft.kz</a></div>
    </div>
  </div>
</body></html>`;

  let pdfBase64: string | null = null;
  try {
    const pdfBuffer = await generateCalculatorPdfBuffer({
      description,
      smeta: clientSmeta,
    });
    pdfBase64 = pdfBuffer.toString("base64");
  } catch (e) {
    console.error("[calculator] PDF generation for email failed", e);
  }

  try {
    const result = await resend.emails.send({
      from: "Vibecraft <onboarding@resend.dev>",
      to: email,
      replyTo: "hello@vibecraft.kz",
      subject: buildSubject(description),
      html,
      attachments: pdfBase64
        ? [
            {
              filename: "vibecraft-smeta.pdf",
              content: pdfBase64,
            },
          ]
        : undefined,
    });
    console.log("[calculator] email sent", {
      to: email,
      id: result.data?.id,
      withPdf: Boolean(pdfBase64),
    });
  } catch (e) {
    console.error("[calculator] Resend error", e);
  }
}

// Дешевая Haiku-классификация перед дорогим Sonnet-расчетом.
// Отсекает белиберду (qwerty, asdf, тестовые строки) за ~$0.0002 вместо
// $0.005 которые сжигает Sonnet на бессмысленный запрос.
const SPAM_FILTER_PROMPT = `Ты классифицируешь описание клиента для AI-калькулятора стоимости разработки.

Услуги: боты, AI-агенты, AI-сайты, MVP веб/мобильных приложений, автоматизации.

Категории:

VALID — любой осмысленный текст на естественном языке, даже непрофильный (например «хочу подстричься» — VALID, потому что осмысленный) или размытый («что-то для бизнеса» — тоже VALID).

SPAM — бессмысленный набор букв или слов: qwerty/asdfgh, тестовые строки (lorem ipsum, test test), повторы одного слова, случайные символы без смысла, бот-спам.

Ответь ТОЛЬКО одним словом: VALID или SPAM.`;

async function isSpamDescription(description: string): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      system: [
        {
          type: "text",
          text: SPAM_FILTER_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: description }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .toUpperCase();
    const isSpam = text.includes("SPAM");
    console.log("[calculator] spam filter", { result: text, isSpam });
    return isSpam;
  } catch (e) {
    console.error("[calculator] spam filter error, allowing through", e);
    return false;
  }
}

function extractUpsells(reply: string): string {
  const match = reply.match(
    /ВОЗМОЖНЫЕ АПСЕЙЛЫ:\s*([\s\S]*?)(?=\nПРИМЕЧАНИЕ:|$)/,
  );
  return match ? match[1].trim() : "";
}

async function notifyTelegram(
  description: string,
  reply: string,
  email: string | null,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const clientReply = stripUpsells(reply);
  const upsells = extractUpsells(reply);

  const lines: (string | null)[] = [
    "🧮 <b>Новый расчет в калькуляторе</b>",
    "",
    email ? `📧 <code>${escapeHtml(email)}</code>` : null,
    email ? "" : null,
    "📝 <b>Описание клиента:</b>",
    `<blockquote>${escapeHtml(description.slice(0, 1500))}</blockquote>`,
    "",
    "📊 <b>Смета (что увидит клиент):</b>",
    `<pre>${escapeHtml(clientReply.slice(0, 2000))}</pre>`,
    upsells ? "" : null,
    upsells
      ? "💡 <b>Апсейлы (для тебя, в разговоре с клиентом):</b>"
      : null,
    upsells ? `<pre>${escapeHtml(upsells.slice(0, 1000))}</pre>` : null,
  ];

  const text = lines
    .filter((l): l is string => l !== null)
    .join("\n")
    .slice(0, 4000);

  try {
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
    console.error("[calculator] Telegram notify error", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = getClientIp(req);
      const result = await ratelimit.limit(ip);
      console.log("[calculator] ratelimit check", {
        ip,
        success: result.success,
        remaining: result.remaining,
      });
      if (!result.success) {
        const minutesLeft = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 60000),
        );
        return NextResponse.json(
          {
            error: `Лимит расчетов исчерпан (5 в час). Попробуйте через ${minutesLeft} мин или напишите в Telegram @borisk85.`,
          },
          { status: 429 },
        );
      }
    } else {
      console.warn(
        "[calculator] ratelimit DISABLED — KV/UPSTASH env vars missing",
      );
    }

    const body = await req.json();
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const email =
      typeof body?.email === "string" && body.email.trim()
        ? body.email.trim().slice(0, 200)
        : null;

    if (!description) {
      return NextResponse.json({ error: "Опишите задачу" }, { status: 400 });
    }
    if (description.length < 20) {
      return NextResponse.json(
        {
          error:
            "Слишком короткое описание. Опишите задачу хотя бы парой предложений.",
        },
        { status: 400 },
      );
    }
    if (description.length > 3000) {
      return NextResponse.json(
        { error: "Слишком длинное описание (максимум 3000 символов)" },
        { status: 400 },
      );
    }

    // Дешевый Haiku-фильтр перед Sonnet — отсекает белиберду чтобы не жечь
    // $0.005 за каждый qwerty-asdfgh. Стоимость фильтра ~$0.0002.
    if (await isSpamDescription(description)) {
      return NextResponse.json({
        reply:
          "Опишите задачу подробнее — что нужно сделать и для какого бизнеса или цели.",
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: CALCULATOR_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: description }],
    });

    const rawReply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const YO_LOWER = String.fromCharCode(0x0451);
    const YO_UPPER = String.fromCharCode(0x0401);
    const reply = rawReply
      .split(YO_LOWER)
      .join("е")
      .split(YO_UPPER)
      .join("Е");

    const finalReply =
      reply ||
      "Не получилось рассчитать смету. Напишите Борису в Telegram @borisk85.";

    // Клиенту НЕ показываем секцию «ВОЗМОЖНЫЕ АПСЕЙЛЫ» (это внутренняя инфа
    // для владельца — что можно допродать в реальном разговоре).
    // В Telegram владельцу — отправляем полный finalReply с апсейлами.
    const clientReply = stripUpsells(finalReply);

    // waitUntil говорит Vercel держать serverless-функцию живой пока background-
    // задачи не завершатся. Без него Vercel закрывает runtime после return и
    // unawaited fetch к Telegram/Resend убивается до отправки.
    waitUntil(
      notifyTelegram(description, finalReply, email).catch((e) => {
        console.error("[calculator] Telegram notify failed", e);
      }),
    );

    if (email) {
      waitUntil(
        sendEmailToClient(email, description, clientReply).catch((e) => {
          console.error("[calculator] Email send failed", e);
        }),
      );
    }

    return NextResponse.json({ reply: clientReply });
  } catch (error) {
    console.error("Calculator API error:", error);
    return NextResponse.json(
      {
        error:
          "Не удалось рассчитать смету. Попробуйте позже или напишите в Telegram @borisk85.",
      },
      { status: 500 },
    );
  }
}
