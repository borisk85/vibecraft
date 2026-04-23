import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";

const steps = [
  {
    step: "01",
    title: "Принимаю заявку и уточняю детали",
    description:
      "Вы пишете мне в Telegram или через форму на сайте. Отвечу вам в течение рабочего дня, в пределах 1–2 часов. Разбираем с вами задачу: контекст, пути реализации, нужный результат. Предлагаю стек, сроки и стоимость.",
  },
  {
    step: "02",
    title: "Собираю продукт и показываю демо",
    description:
      "Готовый бот, AI-агент, AI-сайт или автоматизация, либо кликабельный прототип MVP. Показываю прогресс по вашему запросу — не чаще одного раза в 3-5 дней. Правки вносятся вами сразу, а не в конце.",
  },
  {
    step: "03",
    title: "Сдаю продукт",
    description:
      "Передаю вам продукт, доступы и документацию. 14 дней бесплатных правок после сдачи. Далее — поддержка по тарифу или почасово.",
  },
];

export function Process() {
  return (
    <MotionSection id="process" className="relative py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Процесс"
          title="Как происходит работа"
          description="Прозрачные этапы, регулярные демо и поэтапная оплата. Вы видите прогресс разработки и управляете тонкостями до самого конца."
        />

        <MotionStagger className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2].map((i) => (
            <div
              key={`line-${i}`}
              aria-hidden
              className="pointer-events-none absolute hidden md:block"
              style={{
                top: "1.75rem",
                left: `calc(${i} * (100% - 3rem) / 3 + ${i - 1}rem)`,
                width: "1.5rem",
                height: "1px",
                background: "rgba(249, 168, 212, 0.35)",
              }}
            />
          ))}
          {steps.map((step) => (
            <MotionItem
              key={step.step}
              interactive
              className="relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors duration-200 hover:border-accent"
            >
              <span className="font-mono text-sm text-accent-text">
                {step.step}
              </span>
              <h3 className="text-balance text-base font-semibold tracking-tight text-foreground lg:text-[17px]">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted">
                {step.description}
              </p>
            </MotionItem>
          ))}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
