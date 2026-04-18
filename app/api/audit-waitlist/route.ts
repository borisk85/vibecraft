import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/*
  Приём email'ов со страницы /audit (waitlist для будущего инструмента).
  Сохраняет email в Supabase (таблица audit_waitlist, unique по email)
  и параллельно шлёт дубль-уведомление в Telegram. Duplicate email
  (Postgres 23505) не ошибка — возвращаем ok с флагом duplicate.

  Env:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID
*/

async function sendTelegram(email: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const text = `🟣 Заявка на аудит (waitlist) — vibecraft.kz/audit\nEmail: ${email}`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[audit-waitlist] Telegram error", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 200);

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Некорректный email" },
        { status: 400 },
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      console.error("[audit-waitlist] Supabase env не заданы");
      return NextResponse.json(
        { error: "Хранилище не настроено" },
        { status: 503 },
      );
    }

    const { error } = await supabase
      .from("audit_waitlist")
      .insert({ email });

    if (error) {
      // Postgres unique_violation — email уже в списке
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      console.error("[audit-waitlist] Supabase error", error);
      return NextResponse.json({ error: "Ошибка БД" }, { status: 502 });
    }

    // Дубль в Telegram — не блокируем ответ пользователю
    void sendTelegram(email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[audit-waitlist] Unexpected error", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка" },
      { status: 500 },
    );
  }
}
