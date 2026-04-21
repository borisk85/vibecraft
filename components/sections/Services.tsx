import {
  ArrowRight,
  Bot,
  Code2,
  Smartphone,
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
    title: "Боты и AI-ассистенты",
    description:
      "Telegram или WhatsApp. От простого бота до умного AI-ассистента, с памятью и интеграциями. Под вашу задачу — бот-консультант, прием заказов, поддержка, персональный помощник и т.д.",
    price: "от 300 000 ₸",
    duration: "до 1 недели",
  },
  {
    icon: Code2,
    title: "MVP веб-приложений",
    description:
      "Запускаемый прототип с одной ключевой функцией — авторизация, база, платежи. Проверка идеи в проде за 1-2 недели, без полировки готового SaaS. Стек Next.js + Supabase или Railway.",
    price: "от 1 200 000 ₸",
    duration: "1-2 недели",
  },
  {
    icon: Workflow,
    title: "AI-автоматизации и workflows",
    description:
      "Agentic workflows, webhook-интеграции, multi-step процессы. Modal, Claude API, n8n — под задачу.",
    price: "от 350 000 ₸",
    duration: "до 1 недели",
  },
  {
    icon: Smartphone,
    title: "MVP мобильных приложений",
    description:
      "iOS и Android из одного кода на Flutter. Прототип с одной ключевой функцией для проверки идеи — без полной полировки и долгих публикаций в сторе.",
    price: "от 2 500 000 ₸",
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
          description="Четыре направления AI-разработки — от простых ботов до сложных автоматизаций. Стек подбирается под каждую конкретную задачу."
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
                  Напишите в Telegram — посмотрю задачу и предложу решение.
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
