import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";
import { Eye, Gauge, Puzzle } from "lucide-react";

const points = [
  {
    icon: Gauge,
    title: "AI — скорость и качество, я — решения и управление",
    description:
      "Claude Code берет на себя всю рутину и архитектуру. Безопасность, функционал и бизнес-логика — на мне.",
  },
  {
    icon: Puzzle,
    title: "Кастомное решение под вашу задачу",
    description:
      "Учитываю все уникальные особенности вашего заказа: логику, процессы и необходимые интеграции — от платежных сервисов до нестандартных сценариев.",
  },
  {
    icon: Eye,
    title: "Прозрачные этапы работы и ваш контроль",
    description:
      "Регулярные демо по запросу. Вы видите работающий продукт на старте, а не в конце. Оплата поэтапно — никаких вложений вслепую без результатов.",
  },
];

export function Solution() {
  return (
    <MotionSection id="solution" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Подход"
          title="Как я работаю"
          description="Максимум сосредоточения над каждой задачей. Быстрый и понятный процесс от начала до конечного продукта, без исчезновений, удлинения сроков и стоимости."
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
          {points.map((point, index) => (
            <MotionItem
              key={point.title}
              className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-4 font-mono text-5xl font-bold leading-none text-foreground/10"
              >
                0{index + 1}
              </span>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-accent text-white">
                <point.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {point.title}
              </h3>
              <p className="text-muted leading-relaxed">{point.description}</p>
            </MotionItem>
          ))}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
