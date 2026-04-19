import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const rows = [
  {
    label: "Срок",
    studio: "1-3 месяца",
    vibecraft: "до 2 недель",
  },
  {
    label: "Команда",
    studio: "менеджер, дизайнер, разработчики — цепочка из 3-5 человек",
    vibecraft: "один человек и Claude",
  },
  {
    label: "Бюджет",
    studio: "кратно выше за счет штата и процессов",
    vibecraft: "прозрачный, стартовые цены открыто",
  },
  {
    label: "Коммуникация",
    studio: "через менеджера, правки через брифы",
    vibecraft: "напрямую с разработчиком",
  },
  {
    label: "Прогресс",
    studio: "«мы работаем над задачей» неделями",
    vibecraft: "живые демо в процессе",
  },
  {
    label: "Правки",
    studio: "удлиняют проект и смету",
    vibecraft: "вносятся в процессе работы",
  },
];

export function Pain() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Проблема"
          title="Студия против Vibecraft"
          description="Одна и та же задача — две разные истории. Сравнение по пунктам, которые реально влияют на результат."
        />

        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[1fr_1.5fr_1.5fr] border-b border-border bg-surface text-xs font-mono uppercase tracking-[0.15em] text-subtle md:grid">
            <div className="px-6 py-4" />
            <div className="border-l border-border px-6 py-4">
              Классическая студия
            </div>
            <div className="border-l border-border bg-card px-6 py-4 text-accent-text">
              Vibecraft
            </div>
          </div>

          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr] ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="bg-surface px-6 py-4 font-mono text-xs uppercase tracking-[0.15em] text-muted md:border-r md:border-border md:py-5">
                {row.label}
              </div>
              <div className="px-6 py-4 text-sm text-subtle md:border-r md:border-border md:py-5">
                <div className="mb-1 font-mono text-xs uppercase tracking-[0.15em] text-subtle/80 md:hidden">
                  Классическая студия
                </div>
                {row.studio}
              </div>
              <div className="bg-card px-6 py-4 text-sm text-foreground md:py-5">
                <div className="mb-1 font-mono text-xs uppercase tracking-[0.15em] text-accent-text md:hidden">
                  Vibecraft
                </div>
                {row.vibecraft}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}
