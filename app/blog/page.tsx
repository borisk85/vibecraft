import type { Metadata } from "next"
import { Suspense } from "react"
import { Container } from "@/components/shared/Container"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { posts } from "@/lib/blog-posts"
import BlogContent from "@/components/blog/BlogContent"

const visiblePosts = posts.filter((p) => !p.hidden)

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Обзоры и цены на Telegram-боты, автоматизации и приложения для бизнеса в Казахстане. Что выбрать, сколько стоит и какие сценарии реально работают.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Блог Vibecraft",
    description:
      "Обзоры и цены на Telegram-боты, автоматизации и приложения для бизнеса в Казахстане.",
    url: "https://vibecraft.kz/blog",
    type: "website",
  },
}

export default function BlogIndexPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-24 md:py-32">
        <Container>
          <div className="mb-14 flex flex-col items-center gap-4 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Блог
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Боты, ИИ-агенты, автоматизации и приложения для бизнеса в Казахстане
            </h1>
            <p className="max-w-2xl text-pretty text-base text-muted md:text-lg">
              Обзоры и сравнения решений, реальные цены и рабочие сценарии
              для малого и среднего бизнеса. Поможет понять, что подойдет
              вашему делу и сколько это стоит.
            </p>
          </div>

          <Suspense fallback={null}>
            <BlogContent posts={visiblePosts} />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  )
}
