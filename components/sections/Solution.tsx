import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";
import { Gauge, ShieldCheck, Target } from "lucide-react";

const points = [
  {
    icon: Gauge,
    title: "AI — скорость и качество, я — решения и управление",
    description:
      "Claude Code берет на себя всю рутину и архитектуру. Безопасность, функционал и бизнес-логика — на мне.",
  },
  {
    icon: Target,
    title: "Кастомное решение точно под вашу задачу",
    description:
      "Учитываю все уникальные особенности вашего заказа: логику, процессы и необходимые интеграции — от платежных сервисов до нестандартных сценариев.",
  },
  {
    icon: ShieldCheck,
    title: "Прозрачные этапы и контроль на вашей стороне",
    description:
      "Демо каждые 3–5 дней. Видите работающий продукт в процессе, а не в конце. Оплата поэтапно — никаких вложений вслепую.",
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

        <MotionStagger className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {points.map((point) => (
            <MotionItem
              key={point.title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-8"
            >
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
