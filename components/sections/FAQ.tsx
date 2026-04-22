"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { Plus } from "lucide-react";

type Faq = {
  q: string;
  a: string;
  node?: React.ReactNode;
};

export const faqs: Faq[] = [
  {
    q: "Почему так быстро? Быстрее чем у студий разработки?",
    a: "Скорость обеспечивается за счет работы с Claude Code: ИИ берет на себя архитектуру, код, правки и тесты. Безопасность, бизнес-логику и функционал я создаю и проверяю сам.",
  },
  {
    q: "Как с оплатой?",
    a: "Kaspi: по номеру телефона — для частных клиентов, для ТОО и компаниям со счетом, актом и ЭСФ — через выставление счета. 50% предоплата перед началом работ, 50% после итогового демо.",
  },
  {
    q: "Что если в процессе нужны правки?",
    a: "Правки в рамках изначального ТЗ — бесплатно. Если меняется объем (новые экраны, новая логика и т.д.) — пересчитываем стоимость продукта.",
  },
  {
    q: "Какие гарантии после сдачи?",
    a: "14 дней правок после сдачи — баги и мелкие правки бесплатно. Далее — почасово или по подписке на поддержку.",
  },
  {
    q: "Кто владеет кодом после сдачи?",
    a: "Вы. Код ваш полностью: исходники, доступы, репозиторий. Никаких привязок ко мне или к моей инфраструктуре, скрытых подписок и т.д.",
  },
  {
    q: "Работаете ли с ТОО и предоставляете документы?",
    a: "Да, работаю официально через ИП в РК. Счет, акт, ЭСФ через esf.gov.kz — полный комплект документов для бухгалтерии.",
  },
  {
    q: "Оказываете ли поддержку после сдачи проекта?",
    a: "Да. Удобнее всего — месячный пакет: Базовый до 5 часов за 90 000 ₸, Расширенный до 15 часов за 240 000 ₸. Можете продлевать или закрыть в любой момент, без обязательств на годы. Если обращения редкие — почасово, 25 000 ₸ за час. Новые экраны, функции или интеграции — это уже отдельная разработка, не поддержка.",
  },
  {
    q: "Что такое аудит скорости сайта?",
    a: "Бесплатный инструмент на базе Google PageSpeed Insights — запускаем скоро. Введете URL — увидите главные проблемы скорости и приоритизированный план исправлений. Оставить email для уведомления о запуске можно на странице /audit.",
    node: (
      <>
        Бесплатный инструмент на базе Google PageSpeed Insights — запускаем
        скоро. Введете URL — увидите главные проблемы скорости и
        приоритизированный план исправлений. Оставить email для уведомления
        о запуске можно на странице{" "}
        <Link
          href="/audit"
          className="text-accent-text underline-offset-4 hover:underline"
        >
          /audit
        </Link>
        .
      </>
    ),
  },
  {
    q: "А почему не заказать на Upwork, Kwork или других платформах?",
    a: "Я и есть соло-разработчик, только не на платформе, а с собственным брендом и сайтом. Видны реальные продукты в продакшне, есть ИП для работы с ТОО и документов, вы пишете мне лично — не платформе-посреднику. Плюс я в Казахстане, в одном часовом поясе, по-русски — без языковых и временных рисков зарубежных платформ.",
  },
  {
    q: "А если мне нужно что-то, чего нет в списке услуг?",
    a: "Напишите в Telegram — посмотрю задачу. Стек широкий: backend на Python/Node, базы, интеграции, парсинг, автоматизации. Скорее всего возьмусь — или подскажу, к кому идти.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openIndex]);

  return (
    <MotionSection id="faq" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Частые вопросы"
          description="Если что-то осталось непонятным — напишите мне в Telegram, отвечу лично."
        />

        <div
          ref={containerRef}
          className="mx-auto mt-16 max-w-3xl divide-y divide-border border-y border-border"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.q} className="group relative py-6">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start justify-between gap-6 text-left"
                >
                  <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-accent-text">
                    {faq.q}
                  </h3>
                  <Plus
                    className={`mt-1 h-5 w-5 flex-shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.2, ease: "easeOut" },
                      }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-muted leading-relaxed">
                        {faq.node ?? faq.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </MotionSection>
  );
}
