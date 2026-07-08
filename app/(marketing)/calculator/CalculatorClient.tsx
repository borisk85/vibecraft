"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/shared/Container";

const RATE_LIMIT_KEY = "vibecraft_calc_requests";
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRecentRequests(): number[] {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (t) => typeof t === "number" && now - t < RATE_LIMIT_WINDOW_MS,
    );
  } catch {
    return [];
  }
}

function recordRequest() {
  try {
    const list = getRecentRequests();
    list.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(list));
  } catch {}
}

export function CalculatorClient() {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || loading) return;

    const recent = getRecentRequests();
    if (recent.length >= RATE_LIMIT_MAX) {
      const earliest = Math.min(...recent);
      const minutesLeft = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (Date.now() - earliest)) / 60000,
      );
      setError(
        `Лимит расчетов исчерпан (3 в час). Попробуйте через ${minutesLeft} мин или напишите в Telegram @borisk85.`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description,
          email: email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось рассчитать");
      } else {
        setReply(data.reply ?? "");
        recordRequest();
      }
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    if (!reply || pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/calculator/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, smeta: reply }),
      });
      if (!res.ok) {
        setError("Не удалось сгенерировать PDF. Попробуйте позже.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vibecraft-smeta.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось сгенерировать PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-accent opacity-20 blur-[120px] print:hidden"
      />

      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="text-center print:hidden">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Калькулятор
            </span>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Прикиньте стоимость проекта{" "}
              <span className="text-gradient">за минуту</span>
            </h1>
            <p className="mt-4 text-muted md:text-lg">
              Опишите задачу обычным текстом, и наш ИИ-калькулятор выдаст вам
              ориентировочную стоимость.
            </p>
          </div>

          <form
            onSubmit={handleCalculate}
            className="mx-auto mt-10 max-w-xl space-y-4 print:hidden"
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Telegram-бот для приема заказов в кафе с интеграцией iiko, чтобы клиенты могли посмотреть меню и оформить заказ напрямую через бота."
              rows={5}
              maxLength={3000}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-subtle outline-none transition-colors duration-150 focus:border-accent disabled:opacity-50"
            />
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email для копии сметы (необязательно)"
                maxLength={200}
                disabled={loading}
                className="w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors duration-150 focus:border-accent disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-accent text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)] disabled:opacity-50"
            >
              {loading ? "Считаю..." : "Посчитать стоимость"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 text-center text-sm text-error print:hidden">
              {error}
            </p>
          ) : null}

          {reply ? (
            <div className="mt-10 space-y-6 print:mt-0">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 print:border-0 print:bg-white print:p-0 print:text-black">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text print:text-black">
                    Смета Vibecraft
                  </span>
                </div>
                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-foreground print:text-black">
                  {reply}
                </pre>
                <p className="mt-6 border-t border-border pt-4 text-xs text-subtle print:border-gray-300 print:text-gray-600">
                  vibecraft.kz · Telegram: @borisk85 · hello@vibecraft.kz
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 print:hidden sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-medium text-foreground transition-colors duration-150 hover:border-accent disabled:opacity-50 sm:w-auto"
                >
                  {pdfLoading ? "Готовлю PDF..." : "Скачать смету в PDF"}
                </button>
                <Link
                  href="/#contact"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)] sm:w-auto"
                >
                  Перейти к заявке
                </Link>
              </div>
              <p className="text-center text-sm text-muted print:hidden">
                Точная стоимость и срок уточняются после короткого обсуждения задачи.
              </p>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
