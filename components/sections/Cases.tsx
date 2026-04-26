import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { MotionStagger } from "@/components/shared/MotionStagger";
import { MotionItem } from "@/components/shared/MotionItem";
import { ArrowUpRight } from "lucide-react";

type CaseItem = {
  tag: string;
  title: string;
  description: string;
  stack: string[];
  platform: string;
  url?: string;
};

const cases: CaseItem[] = [
  {
    tag: "SaaS · B2B",
    title: "White-label платформа для AI-ассистентов в Telegram",
    description:
      "Multi-tenant архитектура для агентств и инфлюенсеров: каждый клиент получает своего AI-ассистента в Telegram под брендом агентства. Под капотом — Claude с tool use, Google OAuth, биллинг через Lemon Squeezy. Стек собран один раз, ассистент клиента деплоится за день.",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind",
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "Claude",
      "Clerk",
      "Lemon Squeezy",
      "Railway",
      "Vercel",
    ],
    platform: "Web + Telegram",
    url: "https://velabot.io",
  },
  {
    tag: "AI-ассистент · B2C",
    title: "Персональный AI-ассистент в Telegram",
    description:
      "Персональный AI-ассистент с 20+ модулями: погода, курсы валют и криптовалют, напоминания, утренний дайджест, Gmail, Google Calendar, Drive, Tasks, поиск авиабилетов, анализ фото, генерация изображений, голосовой ввод через Whisper. Долгосрочная память — помнит факты между сессиями.",
    stack: [
      "Python 3.12",
      "Claude",
      "Groq Whisper",
      "Redis",
      "Railway",
      "fal.ai",
    ],
    platform: "Telegram",
  },
  {
    tag: "Mobile · B2C",
    title: "Дуэт — AI-эксперт по подбору напитков",
    description:
      "Мобильное приложение с AI-подбором напитка к любому блюду. Три режима ответа от простого до экспертного, история подборов и избранное, быстрый вход через Google. Streaming-ответы Claude, подписочная модель.",
    stack: [
      "Flutter",
      "Dart",
      "FastAPI",
      "Firebase Auth",
      "Firebase Performance",
      "Claude",
    ],
    platform: "iOS + Android",
    url: "https://duetaiapp.com",
  },
];

export function Cases() {
  return (
    <MotionSection id="cases" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Работы"
          title="Проекты, которые в продакшне"
          description="Каждый проект — реальная разработка с Claude Code с нуля до готового продукта."
        />

        <MotionStagger className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cases.map((item) => {
            const card = (
              <MotionItem
                className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent-text">
                    {item.tag}
                  </span>
                  {item.url ? (
                    <ArrowUpRight className="h-4 w-4 text-subtle transition-colors group-hover:text-foreground" />
                  ) : null}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {item.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="border-t border-border pt-4 text-sm">
                  <div className="text-xs text-subtle">Платформа</div>
                  <div className="text-foreground">{item.platform}</div>
                </div>
              </MotionItem>
            );

            return item.url ? (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {card}
              </a>
            ) : (
              <div key={item.title}>{card}</div>
            );
          })}
        </MotionStagger>
      </Container>
    </MotionSection>
  );
}
