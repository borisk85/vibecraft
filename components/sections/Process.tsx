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
      "Пишете в Telegram или через форму. Отвечаю в день обращения — в рабочие часы обычно в течение 1–2 часов.",
  },
  {
    step: "02",
    title: "Провожу бриф 30 минут",
    description:
      "Разбираю задачу: бизнес, боль, нужный результат. Предлагаю стек и объем.",
  },
  {
    step: "03",
    title: "Собираю прототип за 3–5 дней",
    description:
      "Делаю работающий кликабельный прототип. Вы видите ядро продукта до финальной разработки.",
  },
  {
    step: "04",
    title: "Разрабатываю с демо раз в неделю",
    description:
      "Показываю прогресс каждые 5–7 дней. Правки вносятся в процессе, а не в финале — это экономит недели.",
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
          title="Как устроена работа"
          description="Прозрачные этапы, частые демо и поэтапная оплата. Вы видите прогресс и управляете приоритетами в любой момент."
        />

        <MotionStagger className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-5 lg:gap-4">
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
