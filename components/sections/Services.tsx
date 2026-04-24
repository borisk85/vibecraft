import {
  Bot,
  Code2,
  Globe,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";

export const services = [
  {
    icon: Bot,
    title: "Боты",
    description:
      "Telegram или WhatsApp. Простой бот без AI — кнопки, меню, сценарии для типовых задач: прием заказов, уведомления, FAQ, рассылки, сбор заявок.",
    price: "от 300 000 ₸",
    duration: "до 1 недели",
  },
  {
    icon: Sparkles,
    title: "AI-агенты",
    description:
      "Кастомный AI-агент под вашу задачу: память, контекст, интеграции с CRM, базами и внешними API. Заточен под нишу — поддержка клиентов, продажи, SEO, юр-консультации, любая узкая экспертиза.",
    price: "от 600 000 ₸",
    duration: "до 2 недель",
  },
  {
    icon: Code2,
    title: "MVP веб-приложений",
    description:
      "Рабочий прототип с одной главной функцией. Проверка вашей идеи перед полноценной разработкой далее. Минимальный дизайн, лендинг, авторизация, деплой на хостинг. База данных.",
    price: "от 1 200 000 ₸",
    duration: "до 2 недель",
  },
  {
    icon: Globe,
    title: "AI-сайты",
    description:
      "Сайт с нуля с одной встроенной AI-функцией. Лендинг, корпоративный, каталог, промо-сайт или другой формат — на ваш выбор. Варианты функции: AI-чат-консультант на ваших услугах или AI-калькулятор стоимости — конкретный сценарий обсудим под вашу задачу.",
    price: "от 800 000 ₸",
    duration: "до 2 недель",
  },
  {
    icon: Workflow,
    title: "Автоматизации",
    description:
      "Связка нескольких сервисов в один поток и сценарий без ручной работы. Автоматизация процессов, сокращение рутины. Настройка сценария который работает без вашего участия 24/7, экономит ваши ресурсы. Подключение к сторонним сервисам согласно задаче. Полностью кастомизированное решение под каждый отдельный случай.",
    price: "от 500 000 ₸",
    duration: "до 1-2 недель",
  },
  {
    icon: Smartphone,
    title: "MVP мобильных приложений",
    description:
      "Рабочий прототип с одной главной функцией на iOS и Android из одного кода на Flutter. Проверка вашей идеи перед полноценной разработкой. Минимальный дизайн, авторизация, база данных, сборка для теста на обеих платформах. Публикации в App Store / Google Play не входят в стоимость и не предоставляются как отдельная услуга.",
    price: "от 2 000 000 ₸",
    duration: "до 2 недель",
  },
];

export function Services() {
  return (
    <MotionSection id="services" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Услуги"
          title="Что я делаю"
          description="Шесть направлений — от простых ботов до MVP веб- и мобильных приложений. Стек подбирается под каждую задачу."
        />

        <MotionStagger className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <MotionItem
              key={service.title}
              interactive
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-accent"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                <service.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-foreground">
                  {service.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {service.description}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <span className="font-mono text-sm font-medium text-foreground">
                  {service.price}
                </span>
                <span className="text-xs text-subtle">{service.duration}</span>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-accent/30 bg-card/40 p-8 text-center md:p-10">
          <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Не знаете, в какую услугу попадает ваша задача?
          </h3>
          <p className="max-w-xl text-muted">
            Опишите ее обычным текстом — AI-калькулятор посчитает стоимость и
            срок выполнения за минуту.
          </p>
          <Link
            href="/calculator"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
          >
            Посчитать стоимость
          </Link>
        </div>
      </Container>
    </MotionSection>
  );
}
