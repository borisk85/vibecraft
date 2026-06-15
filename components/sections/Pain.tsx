import { Check, X } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const studio = [
  "До нескольких месяцев на проект",
  "Коммуникация через менеджера, правки через брифы, бесконечные письма и созвоны",
  "«Мы работаем над задачей» неделями без четких дедлайнов",
  "Правки удлиняют сроки и смету",
  "Высокая цена за счет штата и трудоемких процессов",
];

const vibecraft = [
  "До 2 недель на проект",
  "Общение напрямую с разработчиком, быстрые решения по правкам",
  "Регулярные демо и работающий прототип с первых дней",
  "Правки вносятся по ходу работы без ограничений",
  "Стоимость ниже, чем у студий",
];

export function Pain() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Проблема"
          title="Студия разработки или специалист"
          description="Одна задача — разные сроки, цены и количество людей в работе над проектом."
        />

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-border bg-card p-8 transition-colors duration-300 hover:border-border/90 md:p-10">
            <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-foreground/75">
              Классическая студия разработки
            </h3>
            <ul className="flex flex-col gap-5">
              {studio.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-base leading-relaxed text-foreground/75"
                >
                  <X className="h-5 w-5 flex-shrink-0 text-foreground/75" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Долго", "Сложно", "Дорого"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-foreground/25 bg-foreground/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 transition-colors duration-300 hover:border-accent/40 md:p-10">
            <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-accent-text">
              Vibecraft
            </h3>
            <ul className="flex flex-col gap-5">
              {vibecraft.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-base leading-relaxed text-foreground"
                >
                  <Check
                    className="h-5 w-5 flex-shrink-0 text-accent-text"
                    strokeWidth={2.5}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Быстро", "Просто", "Доступно"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}
