import Link from "next/link";
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
    q: "Почему так быстро? Это точно нормальное качество?",
    a: "Скорость — за счет Claude Code и Cursor: они берут boilerplate, тесты, типизацию, CRUD-обвязку. Архитектуру, безопасность и бизнес-логику пишу сам. Код уходит в продакшн, а не в демо.",
  },
  {
    q: "Как принимаете оплату?",
    a: "Kaspi Gold по номеру телефона — для частных клиентов. ТОО и компаниям со счетом, актом и ЭСФ — через ИП на упрощенке. Суммы от 500 000 ₸ разбиваю поэтапно: 50/50 или 30/40/30.",
  },
  {
    q: "Что если в процессе нужны правки?",
    a: "Правки в рамках изначального ТЗ — бесплатно. Если меняется объем (новые экраны, новая логика) — пересчитываю. Делаю демо каждые 5–7 дней, чтобы правки ловились в процессе, а не после сдачи.",
  },
  {
    q: "Есть ли гарантия?",
    a: "Да. 30 дней бесплатной поддержки после сдачи: баги и мелкие правки — за мой счет. Далее — по тарифу поддержки или почасово, если нужно.",
  },
  {
    q: "Кто владеет кодом после сдачи?",
    a: "Вы. Код ваш полностью: исходники, доступы, репозиторий. Никаких «конструкторов», привязки к моей инфраструктуре или скрытых подписок.",
  },
  {
    q: "Работаете ли с ТОО и предоставляете документы?",
    a: "Да. Работаю через ИП на упрощенке (регистрируется за 15 минут при первом запросе от ТОО-клиента). Счет, акт, ЭСФ через esf.gov.kz — все официально.",
  },
  {
    q: "Делаете ли поддержку после запуска?",
    a: "Да, два формата. Базовый пакет — до 5 часов в месяц за 90 000 ₸. Расширенный — до 15 часов за 240 000 ₸. Или почасово без подписки, если обращения редкие.",
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
    q: "А если мне нужно что-то, чего нет в списке услуг?",
    a: "Напишите в Telegram — посмотрю задачу. Стек широкий: backend на Python/Node, базы, интеграции, парсинг, автоматизации. Скорее всего возьмусь — или подскажу, к кому идти.",
  },
];

export function FAQ() {
  return (
    <MotionSection id="faq" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Частые вопросы"
          description="Если что-то осталось непонятным — пишите в Telegram, отвечу лично."
        />

        <div className="mx-auto mt-16 max-w-3xl divide-y divide-border border-y border-border">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group relative py-6"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-accent-text">
                  {faq.q}
                </h3>
                <Plus className="mt-1 h-5 w-5 flex-shrink-0 text-muted transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-4 text-muted leading-relaxed">
                {faq.node ?? faq.a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}
