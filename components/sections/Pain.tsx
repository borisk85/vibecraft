import { Check, X } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const studio = [
  "1-3 месяца на проект",
  "Команда 3-5 человек — менеджеры, дизайнеры, разработчики",
  "Коммуникация через менеджера, правки через брифы",
  "«Мы работаем над задачей» неделями без демо",
  "Правки удлиняют проект и смету",
  "Цена кратно выше за счёт штата и процессов",
];

const vibecraft = [
  "До 2 недель на проект",
  "Один человек и Claude — без цепочки посредников",
  "Напрямую с разработчиком, быстрые решения",
  "Живые демо и работающий прототип в процессе",
  "Правки вносятся по ходу работы",
  "Прозрачная стоимость, стартовые цены открыто",
];

export function Pain() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Проблема"
          title="Студия против Vibecraft"
          description="Одна и та же задача — две разные истории."
        />

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-border bg-surface/60 p-8 md:p-10">
            <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-subtle">
              Классическая студия
            </h3>
            <ul className="flex flex-col gap-5">
              {studio.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base leading-relaxed text-subtle"
                >
                  <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-subtle/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card p-8 md:p-10">
            <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-accent opacity-[0.04]" />
            <div className="relative">
              <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-accent-text">
                Vibecraft
              </h3>
              <ul className="flex flex-col gap-5">
                {vibecraft.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-base leading-relaxed text-foreground"
                  >
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-text" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}
