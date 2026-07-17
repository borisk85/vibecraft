import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
            <span className="font-mono text-7xl font-bold tracking-tight text-accent-text md:text-8xl">
              404
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Страница не найдена
            </h1>
            <p className="text-pretty text-muted">
              Такой страницы нет или она переехала. Вернитесь на главную.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-accent px-6 text-sm font-semibold text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
            >
              На главную
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
