import type { Metadata } from "next";
import Link from "next/link";
import { AuditForm } from "./AuditForm";

export const metadata: Metadata = {
  title: "Аудит скорости сайта — скоро | Vibecraft",
  description:
    "Бесплатный инструмент аудита скорости сайта запускается скоро. Оставьте email, чтобы получить доступ первыми.",
  robots: { index: false, follow: false },
};

export default function AuditPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          Coming Soon
        </div>

        <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Бесплатный аудит скорости сайта
        </h1>

        <p className="mt-6 text-pretty text-lg text-muted md:text-xl">
          Запускаем скоро. Оставьте email — пришлю ссылку сразу, как только
          инструмент будет готов.
        </p>

        <div className="mt-10 text-left">
          <AuditForm />
        </div>

        <p className="mt-10 text-sm leading-relaxed text-subtle">
          Введете URL сайта — получите короткий отчет с главными проблемами
          скорости и планом исправлений. Бесплатно, без регистрации.
        </p>

        <div className="mt-12">
          <Link
            href="/"
            className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </main>
  );
}
