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
          <div className="relative mx-auto order-2 aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-accent/30 bg-card lg:order-1">
            <Image
              src="/boris.jpg"
              alt="Борис Комаров — AI-фаундер Vibecraft"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover"
            />
          </div>

          <div className="order-1 flex flex-col gap-5 lg:order-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Обо мне
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Привет. Я{" "}
              <span className="text-gradient">AI-фаундер из Алматы</span>
            </h2>
            <div className="flex flex-col gap-4 text-muted leading-relaxed md:text-lg">
              <p>
                Один разработчик, использующий в работе Claude Code, вместо
                классической студии разработки с большой командой и
                бюрократией. До 2 недель собираю то, что у студии занимает
                месяцы. MVP, AI-боты, мобильные приложения, автоматизации —
                все в проде, максимально быстро и качественно.
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
