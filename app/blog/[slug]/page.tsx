import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { posts } from "@/lib/blog-posts";

marked.setOptions({ gfm: true, breaks: false });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post || post.hidden) return { title: "Статья не найдена" };
  return {
    title: `${post.title} — Блог Vibecraft`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://vibecraft.kz/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export async function generateStaticParams() {
  return posts.filter((p) => !p.hidden).map((p) => ({ slug: p.slug }));
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[«»""'']/g, "")
    .replace(/[^\w\sа-яА-Я-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post || post.hidden) notFound();

  const html = post.content ? await marked.parse(post.content) : "";

  const headings = (post.content || "")
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.replace(/^##\s+/, "").trim();
      return { text, id: slugifyHeading(text) };
    });

  let htmlWithIds = html;
  for (const h of headings) {
    htmlWithIds = htmlWithIds.replace(
      `<h2>${h.text}</h2>`,
      `<h2 id="${h.id}">${h.text}</h2>`,
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 py-24 md:py-32">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <span>←</span> Все статьи
            </Link>

            <div className="mb-8">
              <span
                className="mb-4 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: `${post.categoryColor}18`,
                  color: post.categoryColor,
                }}
              >
                {post.category}
              </span>
              <h1 className="mb-4 text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span>{post.date}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{post.readTime} чтения</span>
              </div>
            </div>

            {headings.length >= 3 && (
              <nav className="mb-10 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <details open>
                  <summary className="flex cursor-pointer select-none list-none items-center justify-between p-5 text-xs font-semibold uppercase tracking-wider text-muted [&::-webkit-details-marker]:hidden">
                    Содержание
                    <svg
                      className="h-4 w-4 text-muted transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <ol className="list-none space-y-2 px-5 pb-5">
                    {headings.map((h, i) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="flex items-baseline gap-2 text-sm text-muted transition-colors hover:text-accent"
                        >
                          <span className="min-w-[1.2rem] font-mono text-xs text-muted/70">
                            {i + 1}.
                          </span>
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </details>
              </nav>
            )}

            <article
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: htmlWithIds }}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
