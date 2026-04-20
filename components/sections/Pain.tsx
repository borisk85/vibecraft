import { Check, X } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const studio = [
  "Несколько месяцев на проект",
  "Команда из 3-5 и более человек — менеджеры, дизайнеры, разработчики",
  "Коммуникация через менеджера, правки через брифы и бесконечные письма, созвоны",
  "«Мы работаем над задачей» неделями без четких дедлайнов",
  "Правки удлиняют сроки и смету",
  "Цена намного выше за счет штата и трудоемких процессов",
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
          title="Студия разработки или Vibecraft"
          description="Одна задача — разные сроки, цены и количество людей в работе над проектом."
        />

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-border/70 bg-surface/40 p-8 md:p-10">
            <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-subtle/70">
              Классическая студия разработки
            </h3>
            <ul className="flex flex-col gap-5">
              {studio.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base leading-relaxed text-subtle/80"
                >
                  <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-subtle/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-accent/40 bg-card p-8 shadow-[0_10px_40px_-20px_rgba(139,92,246,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/70 hover:shadow-[0_25px_70px_-15px_rgba(139,92,246,0.55)] md:p-10">
            <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-accent opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.14]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-[90px] transition-opacity duration-300 group-hover:bg-accent/40" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-accent-pink/15 blur-[80px]" />
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
                    <Check
                      className="mt-0.5 h-6 w-6 flex-shrink-0 text-accent-text drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                      strokeWidth={2.5}
                    />
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
