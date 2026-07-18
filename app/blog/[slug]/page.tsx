import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import { posts } from "@/lib/blog-posts";
import PostCover from "@/components/blog/PostCover";
import ShareButtons from "@/components/blog/ShareButtons";
import BlogCtaBlock from "@/components/blog/BlogCtaBlock";

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
    // Только заголовок статьи. Бренд «— Vibecraft» добавляет шаблон title в layout —
    // если писать «Блог Vibecraft» здесь, бренд задваивается в <title>.
    title: post.title,
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

// Достаем вопросы/ответы из секции ## FAQ (вопросы — H3) для FAQPage JSON-LD.
function extractFaq(md: string): { q: string; a: string }[] {
  const idx = md.search(/\n##\s+FAQ\b/);
  if (idx === -1) return [];
  const section = md.slice(idx);
  const blocks = section.split(/\n###\s+/).slice(1);
  const items: { q: string; a: string }[] = [];
  for (const b of blocks) {
    const nl = b.indexOf("\n");
    if (nl === -1) continue;
    const q = b.slice(0, nl).trim();
    let a = b.slice(nl).trim();
    const nextH2 = a.search(/\n##\s+/);
    if (nextH2 !== -1) a = a.slice(0, nextH2).trim();
    a = a
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (q && a) items.push({ q, a });
  }
  return items;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post || post.hidden) notFound();

  // Маркеры [📸 СКРИН ...] не выводим как текст статьи (1:1 как на VELA-блоге):
  // в источнике они остаются, визуал в статье дает кавер категории ниже.
  const cleanContent = (post.content || "").replace(/\[📸[^\]]*\]/g, "");
  const html = cleanContent ? await marked.parse(cleanContent) : "";

  const headings = cleanContent
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

  // Широкие таблицы — в горизонтально-скроллящийся контейнер: на мобильном скроллится
  // таблица, а не вся страница (как на VELA compare). Работает для ЛЮБОЙ таблицы любой
  // будущей статьи — обертка ставится всем <table> автоматически.
  htmlWithIds = htmlWithIds
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>");

  const postUrl = `https://vibecraft.kz/blog/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    mainEntityOfPage: postUrl,
    image: `${postUrl}/opengraph-image`,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "ru",
    about: "Разработка Telegram-ботов, MVP и автоматизаций в Казахстане",
    articleSection: post.category,
    author: {
      "@type": "Person",
      name: "Борис Комаров",
      url: "https://vibecraft.kz",
    },
    publisher: {
      "@type": "Organization",
      name: "Vibecraft",
      url: "https://vibecraft.kz",
      logo: {
        "@type": "ImageObject",
        url: "https://vibecraft.kz/og-image.png",
      },
    },
  };

  const faq = extractFaq(cleanContent);
  const faqSchema =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={articleSchema} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
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
              <h1 className="mb-4 text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span>{post.date}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{post.readTime} чтения</span>
              </div>
            </div>

            <PostCover
              category={post.category}
              iconKey={post.iconKey}
              large
              className="mb-10 h-52 w-full rounded-2xl sm:h-64"
            />

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

            <BlogCtaBlock />

            <ShareButtons
              url={`https://vibecraft.kz/blog/${post.slug}`}
              title={post.title}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
