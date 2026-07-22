/**
 * Запасной ограничитель частоты запросов — в памяти процесса, без внешней базы.
 *
 * Класс ошибки (22.07.2026): rate limit жил только на Upstash. Базу удалили
 * 25 мая, хост перестал резолвиться — и калькулятор отдавал ошибку на каждый
 * запрос 59 дней подряд. Внешний сервис не должен быть единственным способом
 * посчитать, сколько раз человек нажал кнопку.
 *
 * Счетчик живет в памяти одного serverless-инстанса, поэтому при нескольких
 * инстансах реальный лимит будет выше номинального. Это осознанный размен:
 * задача — отсечь того, кто жмет кнопку десятками раз и жжет деньги на API,
 * а не выстроить точный учет.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export type MemoryLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export function memoryRatelimit(
  key: string,
  limit: number,
  windowMs: number,
): MemoryLimitResult {
  const now = Date.now();

  // Чистим протухшие записи, чтобы память не росла бесконечно на долгоживущем
  // инстансе. Дешевле полного прохода: чистим только когда карта разрослась.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { success: true, remaining: limit - 1, reset: fresh.resetAt };
  }

  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
  };
}
