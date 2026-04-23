import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const rawHistory: unknown[] = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "Сообщение пустое" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Слишком длинное сообщение" }, { status: 400 });
    }

    const history: IncomingMessage[] = rawHistory
      .filter(
        (m): m is IncomingMessage =>
          typeof m === "object" &&
          m !== null &&
          (m as IncomingMessage).role !== undefined &&
          ((m as IncomingMessage).role === "user" ||
            (m as IncomingMessage).role === "assistant") &&
          typeof (m as IncomingMessage).content === "string",
      )
      .slice(-10);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: CHAT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    });

    const rawReply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const YO_LOWER = String.fromCharCode(0x0451);
    const YO_UPPER = String.fromCharCode(0x0401);
    const reply = rawReply.split(YO_LOWER).join("е").split(YO_UPPER).join("Е");

    return NextResponse.json({ reply: reply || "Не получилось сформулировать ответ. Напишите Борису в Telegram @borisk85." });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          "Не удалось получить ответ. Попробуйте позже или напишите в Telegram @borisk85.",
      },
      { status: 500 },
    );
  }
}
