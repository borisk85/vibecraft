import { Check, X } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const studio = [
  "До нескольких месяцев на проект",
  "Команда из 3-5 и более человек — менеджеры, дизайнеры, разработчики",
  "Коммуникация через менеджера, правки через брифы и бесконечные письма, созвоны",
  "«Мы работаем над задачей» неделями без четких дедлайнов",
  "Правки удлиняют сроки и смету",
  "Цена намного выше за счет штата и трудоемких процессов",
];

const vibecraft = [
  "До 2 недель на проект",
  "Один человек в работе над проектом — без цепочки посредников",
  "Общение напрямую с разработчиком, быстрые решения по правкам",
  "Регулярные демо и работающий прототип с первых дней",
  "Правки вносятся по ходу работы без ограничений",
  "Адекватная стоимость, дешевле студий в несколько раз",
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
            <h3 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-subtle">
              Классическая студия разработки
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

          <div className="rounded-2xl border border-border bg-card p-8 transition-colors duration-300 hover:border-accent/40 md:p-10">
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
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-text"
                    strokeWidth={2.5}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}
