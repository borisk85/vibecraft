import Link from "next/link";
import { Send } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { LogoGradient } from "@/components/shared/LogoGradient";
import { MotionSection } from "@/components/shared/MotionSection";
import { siteConfig } from "@/lib/metadata";

export function About() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
          {/* Заглушка под фото — до реального снимка */}
          <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-accent/30 bg-card">
            <div className="absolute inset-0 flex items-center justify-center">
              <LogoGradient className="h-32 w-32" />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Обо мне
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Привет. Я{" "}
              <span className="text-gradient">AI-фаундер из Алматы</span>
            </h2>
            <div className="flex flex-col gap-4 text-muted leading-relaxed md:text-lg">
              <p>
                Меня зовут Борис. Я AI-фаундер из Алматы, 7+ лет в IT.
                Vibecraft — мой персональный бренд: один разработчик + AI-
                инструменты вместо классической студии с иерархией. Последние
                2 года строю продукты на AI-стеке: веду собственный SaaS для
                Telegram-ботов и параллельно запускаю клиентские проекты.
                Claude Code и Cursor делают рутину, архитектуру, безопасность
                и результат контролирую лично. Если что-то обещаю — делаю.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={siteConfig.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors duration-150 hover:border-accent"
              >
                <Send className="h-4 w-4 text-accent-text" />
                Telegram
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}
