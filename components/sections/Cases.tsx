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
  status: string;
  platform: string;
  url?: string;
};

const cases: CaseItem[] = [
  {
    tag: "SaaS · Flagship",
    title: "SaaS-платформа для AI-ботов в Telegram",
    description:
      "Multi-tenant платформа: пользователь без кода собирает своего AI-бота с подключением к Claude. Agent loop с tool use, биллинг через Lemon Squeezy, платные подписки.",
    stack: [
      "Next.js",
      "TypeScript",
      "Clerk",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "Claude",
      "Railway",
    ],
    status: "В продакшне",
    platform: "Web + Telegram",
    url: "https://velabot.io",
  },
  {
    tag: "Telegram · AI · Личный",
    title: "Персональный AI-ассистент в Telegram",
    description:
      "Голосовой ассистент с agent loop на Claude и распознаванием речи через Groq Whisper. Подключены Gmail, Google Calendar, Drive, Tasks, Brave Search, CoinGecko, Binance и fal.ai — все в одном интерфейсе.",
    stack: [
      "Python 3.12",
      "Claude",
      "Groq Whisper",
      "Redis",
      "Railway",
      "GitHub CI/CD",
    ],
    status: "В продакшне",
    platform: "Telegram",
  },
  {
    tag: "Mobile · iOS + Android",
    title: "Дуэт — AI-эксперт по подбору напитков",
    description:
      "Мобильное приложение с AI-подбором напитка к любому блюду. Три режима ответа от простого до экспертного, история подборов и избранное, работа без регистрации. Streaming-ответы Claude, подписочная модель через RevenueCat.",
    stack: [
      "Flutter",
      "Dart",
      "FastAPI",
      "Firebase Performance",
      "RevenueCat",
      "Claude",
    ],
    status: "Закрытое тестирование",
    platform: "iOS + Android · СНГ",
    url: "https://duetaiapp.com",
  },
];

export function Cases() {
  return (
    <MotionSection id="cases" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Кейсы"
          title="Проекты, которые работают в продакшне"
          description="Каждый кейс — реальная разработка. Архитектуру, стек и продуктовые решения разберу на созвоне."
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
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                  <div>
                    <div className="text-xs text-subtle">Статус</div>
                    <div className="text-foreground">{item.status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-subtle">Платформа</div>
                    <div className="text-foreground">{item.platform}</div>
                  </div>
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
