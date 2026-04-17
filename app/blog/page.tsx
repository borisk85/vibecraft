import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Статьи о разработке Telegram-ботов, MVP, SaaS и автоматизаций в Казахстане. Цены, стек, процесс работы и разборы реальных проектов.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-24 md:py-32">
        <Container>
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Блог
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Статьи скоро появятся
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-muted">
              Готовлю материалы о разработке Telegram-ботов, MVP на Next.js,
              автоматизациях Make.com и ценах на рынке Казахстана. Первая партия —
              в ближайшие недели.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
