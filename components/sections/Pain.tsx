import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";
import { Clock, EyeOff, PackageX, Wallet } from "lucide-react";

const pains = [
  {
    icon: Wallet,
    title: "2 000 000 ₸ и 2 месяца за задачу на 2 недели",
    description:
      "Классическая цепочка аналитик → дизайнер → бэк → фронт → PM раздувает и смету, и сроки. Вы платите за иерархию, а не за результат.",
  },
  {
    icon: EyeOff,
    title: "Предоплата ушла — результата нет",
    description:
      "Одиночки без обязательств и студии без процессов — обе крайности ведут к одному: вы платите, но продукта не получаете.",
  },
  {
    icon: PackageX,
    title: "Коробка дает 70% функций и 0% гибкости",
    description:
      "Шаблонные платформы закрывают базу, но ломаются там, где нужна ваша логика: прием оплат через Kaspi, нестандартный воркфлоу, интеграции под ваш процесс.",
  },
  {
    icon: Clock,
    title: "Месяц молчания и «мы работаем над задачей»",
    description:
      "Нет этапов, нет демо, нет понимания, что именно сделано. Только «в работе» и «скоро покажем».",
  },
];

export function Pain() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Проблема"
          title="Почему разработка превращается в боль"
          description="Знакомо? Это не про плохих подрядчиков — это про устаревший формат разработки."
        />

        <MotionStagger className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
          {pains.map((pain) => (
            <MotionItem
              key={pain.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-colors duration-200 hover:border-accent"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                <pain.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                {pain.title}
              </h3>
              <p className="text-muted leading-relaxed">{pain.description}</p>
            </MotionItem>
          ))}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
