"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";

export function CalculatorClient() {
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось рассчитать");
      } else {
        setReply(data.reply ?? "");
      }
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-accent opacity-20 blur-[120px]"
      />

      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Калькулятор
            </span>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Прикиньте стоимость проекта{" "}
              <span className="text-gradient">за минуту</span>
            </h1>
            <p className="mt-4 text-muted md:text-lg">
              Опишите задачу обычным текстом — AI прогонит через прайс
              Vibecraft и выдаст ориентировочную смету. Без созвона и
              опросников.
            </p>
          </div>

          <form onSubmit={handleCalculate} className="mt-10 space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Telegram-бот для приема заказов в кафе с интеграцией iiko, чтобы клиенты могли посмотреть меню и оформить заказ напрямую через бота."
              rows={5}
              maxLength={3000}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-subtle outline-none transition-colors duration-150 focus:border-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-accent text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)] disabled:opacity-50"
            >
              {loading ? "Считаю..." : "Рассчитать стоимость"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 text-center text-sm text-error">{error}</p>
          ) : null}

          {reply ? (
            <div className="mt-10 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
                    Смета
                  </span>
                </div>
                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-foreground">
                  {reply}
                </pre>
              </div>

              <div className="text-center">
                <Link
                  href="/#contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
                >
                  Перейти к заявке
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-sm text-muted">
                  Точная стоимость и срок — после короткого созвона.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
