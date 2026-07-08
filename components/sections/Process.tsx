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
      "Вы пишете мне в Telegram или через форму на сайте. Отвечу вам в течение рабочего дня, в пределах 1–2 часов. Разбираем с вами задачу: контекст, пути реализации, нужный результат. Предлагаю стек, сроки и стоимость.",
  },
  {
    step: "02",
    title: "Собираю продукт",
    description:
      "Готовый бот, ИИ-агент, AI-сайт или автоматизация, либо кликабельный прототип MVP. Показываю прогресс по вашему запросу — не чаще одного раза в 3-5 дней. Правки вносятся вами сразу, а не в конце.",
  },
  {
    step: "03",
    title: "Сдаю и поддерживаю",
    description:
      "Передаю вам готовый продукт, доступы и документацию. 14 дней бесплатных правок после сдачи. Далее, если потребуется, на ваш выбор — поддержка по пакету или почасово.",
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
          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              top: "3.5rem",
              left: "calc((100% - 3rem) / 3)",
              width: "1.5rem",
              height: "1px",
              background: "rgba(249, 168, 212, 0.35)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              top: "3.5rem",
              left: "calc(2 * (100% - 3rem) / 3 + 1.5rem)",
              width: "1.5rem",
              height: "1px",
              background: "rgba(249, 168, 212, 0.35)",
            }}
          />
          {steps.map((step) => (
            <MotionItem
              key={step.step}
              className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-8 transition-colors duration-200 hover:border-accent/40"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-4 font-mono text-5xl font-bold leading-none text-foreground/10"
              >
                {step.step}
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="text-muted leading-relaxed">{step.description}</p>
            </MotionItem>
          ))}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
