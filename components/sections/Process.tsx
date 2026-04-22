import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";

const steps = [
  {
    step: "01",
    title: "Принимаю заявку",
    description:
      "Вы пишете мне в Telegram напрямую или через форму на сайте. Отвечаю вам в течение рабочего дня в пределах 1–2 часов.",
  },
  {
    step: "02",
    title: "Провожу бриф",
    description:
      "Разбираю задачу: контекст, пути реализации, нужный результат. Предлагаю стек, сроки и стоимость.",
  },
  {
    step: "03",
    title: "Собираю продукт",
    description:
      "Боты и автоматизации будут готовы в течение 1 недели, AI-ассистенты — за 1-2 недели. MVP веб- или мобильного приложения будет представлено в качестве демо до финальной полировки.",
  },
  {
    step: "04",
    title: "Показываю демо",
    description:
      "Показываю прогресс по вашему запросу — не чаще одного раза в 3-5 дней. Правки вносятся сразу, а не в конце.",
  },
  {
    step: "05",
    title: "Сдаю и поддерживаю",
    description:
      "Деплой на ваш домен, передача доступов, документация. Поддержка по тарифу или почасово.",
  },
];

export function Process() {
  return (
    <MotionSection id="process" className="relative py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Процесс"
          title="Как происходит работа"
          description="Прозрачные этапы, регулярные демо и поэтапная оплата. Вы видите прогресс и управляете тонкостями разработки до конца."
        />

        <MotionStagger className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-5 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`line-${i}`}
              aria-hidden
              className="pointer-events-none absolute hidden lg:block"
              style={{
                top: "1.75rem",
                left: `calc(${i} * (100% - 4rem) / 5 + ${i - 1}rem)`,
                width: "1rem",
                height: "1px",
                background: "rgba(249, 168, 212, 0.35)",
              }}
            />
          ))}
          {steps.map((step) => (
            <MotionItem
              key={step.step}
              interactive
              className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors duration-200 hover:border-accent lg:p-5"
            >
              <span className="font-mono text-sm text-accent-text">
                {step.step}
              </span>
              <h3 className="text-balance text-base font-semibold tracking-tight text-foreground lg:text-[17px]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </MotionItem>
          ))}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
