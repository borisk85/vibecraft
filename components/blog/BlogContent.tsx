"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Newspaper } from "lucide-react"
import { type Post } from "@/lib/blog-posts"
import { BLOG_CATEGORIES } from "@/lib/blog-categories"
import PostCover from "@/components/blog/PostCover"

// Категории берем из единого источника lib/blog-categories.ts (не хардкодим имена).
const CATEGORIES = [
  { label: "Все", slug: "all" },
  ...BLOG_CATEGORIES.map((c) => ({ label: c.name, slug: c.slug })),
]
const PAGE_SIZE = 9

function slugToLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? "Все"
}

function CategoryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-colors duration-200 hover:border-white/15"
    >
      <PostCover category={post.category} iconKey={post.iconKey} className="h-44 flex-shrink-0" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-white">
          {post.title}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted">
          <span>{post.date}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  )
}

export default function BlogContent({ posts }: { posts: Post[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const activeSlug = params.get("cat") || "all"
  const activeLabel = slugToLabel(activeSlug)
  const page = Math.max(1, Number(params.get("page")) || 1)

  function navigate(slug: string, p: number) {
    const q = new URLSearchParams()
    if (slug !== "all") q.set("cat", slug)
    if (p > 1) q.set("page", String(p))
    const qs = q.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: p !== page })
  }

  const filtered = activeSlug === "all"
    ? posts
    : posts.filter((p) => p.category === activeLabel)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
          <Newspaper className="h-6 w-6 text-accent-text" />
        </div>
        <p className="text-base font-semibold text-foreground">Статьи скоро появятся</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(({ label, slug }) => (
            <button
              key={slug}
              onClick={() => navigate(slug, 1)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeSlug === slug
                  ? "border-accent bg-accent text-white"
                  : "border-white/10 text-muted hover:border-white/20 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">
          {filtered.length} {filtered.length === 1 ? "статья" : filtered.length < 5 ? "статьи" : "статей"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">В этой категории пока нет статей.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => navigate(activeSlug, page - 1)}
                disabled={page === 1}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Назад
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => navigate(activeSlug, p)}
                  className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-accent text-white"
                      : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => navigate(activeSlug, page + 1)}
                disabled={page === totalPages}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
