import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Bot, Gauge, ShieldCheck } from "lucide-react";

const points = [
  {
    icon: Gauge,
    title: "AI пишет код, человек отвечает за результат",
    description:
      "Claude Code и Cursor берут на себя boilerplate, тесты, типизацию, CRUD-обвязку. Архитектуру, безопасность и бизнес-логику пишу сам.",
  },
  {
    icon: Bot,
    title: "Фокус на вашей задаче, а не на шаблоне",
    description:
      "Пишу под вашу логику: ваш CRM, Kaspi Pay, ваш процесс. Никаких коробочных ограничений.",
  },
  {
    icon: ShieldCheck,
    title: "Прозрачные этапы и фиксированные сроки",
    description:
      "Демо каждые 3–5 дней. Вы видите работающий продукт в процессе разработки, а не в конце. Оплата поэтапно.",
  },
];

export function Solution() {
  return (
    <section className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Подход"
          title="AI-разработка без магии и без рисков"
          description="Использую Claude Code и Cursor там, где они дают 3–5-кратное ускорение. Архитектура, безопасность и результат — на мне."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {points.map((point) => (
            <div
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
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
