import crypto from "crypto";

/**
 * Защита калькулятора от абьюза и лишнего расхода токенов.
 *
 * Класс ошибки (Boris, 22.07): счет запросов жил на внешнем Redis, база
 * отвалилась — и лимита не стало вовсе. Восемь запросов подряд с одного
 * браузера прошли без единого отказа: на serverless счетчик в памяти
 * бесполезен, каждый запрос попадает в свой инстанс.
 *
 * Здесь два слоя, оба работают без внешних сервисов:
 *
 * 1. Подписанная кука с меткой последнего расчета. Живет у клиента, но
 *    подделать нельзя — HMAC на серверном секрете. Это главный слой:
 *    нормальный человек считает один раз и уходит, а кто жмет подряд —
 *    получает отказ с оставшимся временем.
 * 2. Счетчик по IP в памяти инстанса. Ловит серии, прилетевшие в один
 *    инстанс, и того, кто чистит куки, но сидит на одном адресе.
 *
 * Обойти можно (инкогнито плюс смена адреса), но это уже осознанный труд
 * ради чужого счета за токены, а не «поиграться с калькулятором».
 */

const COOKIE_NAME = "vc_calc";
export const COOLDOWN_MS = 30 * 60 * 1000; // 30 минут между расчетами
export const DAILY_LIMIT = 3; // не больше 3 расчетов в сутки с одного клиента

function secret(): string {
  return (
    process.env.CALC_GUARD_SECRET ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.ANTHROPIC_API_KEY ||
    "vibecraft-fallback-secret"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type CalcState = { last: number; day: string; count: number };

export function readState(cookieHeader: string | null): CalcState | null {
  if (!cookieHeader) return null;
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1));
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  if (sign(payload) !== mac) return null; // подделали или мусор
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed?.last !== "number") return null;
    return {
      last: parsed.last,
      day: String(parsed.day || ""),
      count: Number(parsed.count) || 0,
    };
  } catch {
    return null;
  }
}

export function buildCookie(state: CalcState): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  const maxAge = 60 * 60 * 24 * 2;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

export function todayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Решение по куке: пускать ли расчет и что сказать клиенту. */
export function checkCooldown(
  state: CalcState | null,
  now: number,
): { allowed: true } | { allowed: false; message: string } {
  if (!state) return { allowed: true };

  const sameDay = state.day === todayKey(now);
  if (sameDay && state.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      message:
        "На сегодня расчеты по этому браузеру исчерпаны. Если задача изменилась или нужен точный расчет, напишите в Telegram @borisk85 — отвечу лично.",
    };
  }

  const passed = now - state.last;
  if (passed < COOLDOWN_MS) {
    const minutesLeft = Math.max(1, Math.ceil((COOLDOWN_MS - passed) / 60000));
    return {
      allowed: false,
      message: `Расчет по этой задаче уже сделан. Следующий можно запросить через ${minutesLeft} мин. Если хотите обсудить смету сейчас, напишите в Telegram @borisk85.`,
    };
  }

  return { allowed: true };
}

export function nextState(state: CalcState | null, now: number): CalcState {
  const day = todayKey(now);
  const sameDay = state?.day === day;
  return {
    last: now,
    day,
    count: sameDay ? (state?.count || 0) + 1 : 1,
  };
}

/**
 * Бесплатная проверка текста ДО обращения к модели: мусор, повторы, спам.
 * Отсекает то, за что платить не хочется вообще (даже дешевым фильтром).
 */
export function looksLikeGarbage(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return true;

  const letters = (t.match(/[a-zA-Zа-яА-Я\u0451\u0401]/g) || []).length;
  if (letters / t.length < 0.5) return true; // половина текста — цифры и символы

  const words = t.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 4) return true;

  const unique = new Set(words);
  if (unique.size / words.length < 0.4) return true; // одно слово по кругу

  // клавиатурный набор и типовые тестовые строки
  if (/(.)\1{6,}/.test(t)) return true;
  if (/(qwer|asdf|zxcv|йцук|фыва|ячсм|lorem ipsum)/i.test(t)) return true;

  return false;
}
