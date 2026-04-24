import Link from "next/link"

export default function BlogCtaBlock() {
  return (
    <div className="my-12 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-white/[0.02] to-white/[0.02] p-8 md:p-10">
      <div className="flex flex-col gap-4">
        <span className="w-fit font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          Следующий шаг
        </span>
        <h3 className="text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl">
          Нужна разработка под вашу задачу?
        </h3>
        <p className="max-w-2xl text-pretty text-sm text-muted md:text-base">
          Опишите задачу — отвечу за 1-2 часа. Бесплатный бриф за 30 минут: план, сроки и финальная стоимость без долгих согласований.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/#contact"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-accent px-5 text-sm font-semibold text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
          >
            Обсудить проект
          </Link>
          <Link
            href="/calculator"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-muted transition-colors hover:border-white/20 hover:text-foreground"
          >
            Прикинуть в калькуляторе
          </Link>
        </div>
      </div>
    </div>
  )
}
