import { Bot, Code2, Smartphone, Sparkles, Workflow } from "lucide-react";
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
    title: "Telegram-боты с AI",
    description:
      "Боты-консультанты, ассистенты, магазины. Claude, память диалога, прием оплат, интеграции с CRM.",
    price: "от 300 000 ₸",
    duration: "5–14 дней",
  },
  {
    icon: Sparkles,
    title: "AI-ассистенты и агенты",
    description:
      "AI-агенты с tool use под личные и бизнес-задачи. Claude, интеграции с Gmail, Calendar, CRM и API, голосовой ввод, работа с данными.",
    price: "от 500 000 ₸",
    duration: "2–3 недели",
  },
  {
    icon: Code2,
    title: "MVP на Next.js + Supabase",
    description:
      "Веб-приложение с авторизацией, базой и платежами. От лендинга до SaaS.",
    price: "от 1 200 000 ₸",
    duration: "2–3 недели",
  },
  {
    icon: Workflow,
    title: "AI-автоматизации и workflows",
    description:
      "Agentic workflows, webhook-интеграции, multi-step процессы. Modal, Claude API, n8n — под задачу.",
    price: "от 200 000 ₸",
    duration: "3–7 дней",
  },
  {
    icon: Smartphone,
    title: "Мобильные приложения Flutter",
    description:
      "iOS и Android из одного кода. Бэкенд, push, прием оплат, выпуск в сторы.",
    price: "от 1 800 000 ₸",
    duration: "3–4 недели",
  },
];

export function Services() {
  return (
    <MotionSection id="services" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Услуги"
          title="Что делаю"
          description="Пять направлений AI-разработки — от ботов и ассистентов до мобильных приложений и workflows. Стек подбираю под задачу."
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

        <div className="mt-10 text-center">
          <Link
            href={siteConfig.contacts.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-text underline-offset-4 hover:underline"
          >
            Нет в списке? Напишите в Telegram — посмотрю задачу
          </Link>
        </div>
      </Container>
    </MotionSection>
  );
}
