import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { posts } from "@/lib/blog-posts";

const visiblePosts = posts.filter((p) => !p.hidden);

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Статьи о разработке Telegram-ботов, MVP и автоматизаций в Казахстане. Цены, стек, процесс работы и разборы реальных проектов.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Блог Vibecraft",
    description:
      "Статьи о разработке Telegram-ботов, MVP и автоматизаций в Казахстане.",
    url: "https://vibecraft.kz/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  if (visiblePosts.length === 0) {
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
                Готовлю материалы о разработке Telegram-ботов, MVP,
                автоматизациях и ценах на рынке Казахстана. Первая партия —
                в ближайшие недели.
              </p>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 py-24 md:py-32">
        <Container>
          <div className="mb-14 flex flex-col items-center gap-4 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Блог
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Статьи о AI-разработке и рынке КЗ
            </h1>
            <p className="max-w-2xl text-pretty text-base text-muted md:text-lg">
              Разборы реальных проектов, цены, процесс работы с AI-стеком
              и тренды на казахстанском рынке.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-accent/60"
                >
                  <span
                    className="inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: `${post.categoryColor}18`,
                      color: post.categoryColor,
                    }}
                  >
                    {post.category}
                  </span>
                  <h2 className="text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-muted">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-xs text-muted">
                    <span>{post.date}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{post.readTime}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  );
}
