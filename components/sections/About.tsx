import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { MotionSection } from "@/components/shared/MotionSection";
import { siteConfig } from "@/lib/metadata";

export function About() {
  return (
    <MotionSection id="about" className="py-24 md:py-28">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-accent/30 bg-card">
            <Image
              src="/boris.jpg"
              alt="Борис Комаров — AI-фаундер Vibecraft"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover"
            />
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
                Один разработчик + Claude Code вместо классической студии.
                За месяц собираю то, что у студии занимает полгода. SaaS,
                боты, мобильные приложения, автоматизации — все в проде,
                не в демо. Если обещаю — делаю.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Пишите в Telegram:</span>
              <Link
                href={siteConfig.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground transition-colors duration-150 hover:text-accent-text"
              >
                <Send className="h-4 w-4" />
                {siteConfig.contacts.telegramHandle}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}
