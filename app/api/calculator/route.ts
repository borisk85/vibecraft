import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CALCULATOR_SYSTEM_PROMPT } from "@/lib/calculator-system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";

    if (!description) {
      return NextResponse.json(
        { error: "Опишите задачу" },
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
      model: "claude-haiku-4-5-20251001",
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

    return NextResponse.json({
      reply:
        reply ||
        "Не получилось рассчитать смету. Напишите Борису в Telegram @borisk85.",
    });
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
