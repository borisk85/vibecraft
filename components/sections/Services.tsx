import {
  ArrowRight,
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
import { siteConfig } from "@/lib/metadata";

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
      "Лендинг или корпоративный сайт с встроенной AI-фичей: чат-консультант на ваших материалах, AI-калькулятор стоимости, AI-аудит как лид-магнит, semantic search по каталогу. Не просто красивый сайт — а тот, который ловит лиды и продает.",
    price: "от 800 000 ₸",
    duration: "до 2 недель",
  },
  {
    icon: Workflow,
    title: "Автоматизации",
    description:
      "Свяжу ваши сервисы и рабочие процессы в единый поток без вашего участия в рутине. Сервисы n8n или Make — для типовых задач, кастомные решения — для нестандартных сценариев.",
    price: "от 350 000 ₸",
    duration: "до 1 недели",
  },
  {
    icon: Smartphone,
    title: "MVP мобильных приложений",
    description:
      "Рабочий прототип на iOS и Android из одного кода на Flutter. Проверка вашей идеи перед полной разработкой и публикацией в сторах. Минимальный дизайн, авторизация, база данных, сборка APK для теста.",
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

          <Link
            href={siteConfig.contacts.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <MotionItem
              interactive
              className="group flex h-full flex-col gap-4 rounded-2xl border border-accent/30 bg-transparent p-7 transition-colors duration-200 hover:border-accent"
            >
              <div>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-foreground">
                  Нет в списке?
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Напишите мне в Telegram — посмотрю задачу и предложу решение.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-end">
                <ArrowRight className="h-5 w-5 text-accent-text transition-transform group-hover:translate-x-0.5" />
              </div>
            </MotionItem>
          </Link>
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
