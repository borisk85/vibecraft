import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { CALCULATOR_SYSTEM_PROMPT } from "@/lib/calculator-system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Серверный rate limit: 5 расчетов в час с одного IP.
// Если ENV для Upstash не настроены — graceful degradation, лимит пропускается
// (полагаемся только на frontend защиту через localStorage).
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "vibecraft:calc",
        analytics: true,
      })
    : null;

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

async function notifyTelegram(
  description: string,
  reply: string,
  email: string | null,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    "<b>Калькулятор: новый расчет</b>",
    "",
    email ? `<b>Email клиента:</b> ${escapeHtml(email)}` : null,
    `<b>Описание задачи:</b>\n${escapeHtml(description.slice(0, 1500))}`,
    "",
    `<b>Смета:</b>\n${escapeHtml(reply.slice(0, 2000))}`,
  ];

  const text = lines.filter(Boolean).join("\n").slice(0, 4000);

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
      const { success, reset } = await ratelimit.limit(ip);
      if (!success) {
        const minutesLeft = Math.max(
          1,
          Math.ceil((reset - Date.now()) / 60000),
        );
        return NextResponse.json(
          {
            error: `Лимит расчетов исчерпан (5 в час). Попробуйте через ${minutesLeft} мин или напишите в Telegram @borisk85.`,
          },
          { status: 429 },
        );
      }
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

    notifyTelegram(description, finalReply, email).catch(() => {});

    return NextResponse.json({ reply: finalReply });
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
