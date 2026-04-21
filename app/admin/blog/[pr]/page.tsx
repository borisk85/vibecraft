import Link from "next/link";
import { headers } from "next/headers";
import EditorClient from "./EditorClient";

async function getArticle(pr: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const res = await fetch(`${proto}://${host}/api/admin/blog/${pr}`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") ?? "" },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ pr: string }>;
}) {
  const { pr } = await params;
  const article = await getArticle(pr);

  if (!article) {
    return (
      <div>
        <Link
          href="/admin/blog"
          className="text-sm text-accent-text hover:underline"
        >
          ← Все черновики
        </Link>
        <div className="mt-8 rounded-xl border border-error/30 bg-error/5 p-6 text-error">
          Не удалось загрузить статью PR #{pr}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/blog"
        className="text-sm text-accent-text hover:underline"
      >
        ← Все черновики
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-bold">{article.title}</h1>
      {article.excerpt && (
        <p className="mb-2 text-sm italic text-muted">{article.excerpt}</p>
      )}
      <div className="mb-6 flex flex-wrap gap-2 text-xs text-muted">
        <span>PR #{article.pr_number}</span>
        <span>·</span>
        <span>slug: {article.slug}</span>
        {article.category && (
          <>
            <span>·</span>
            <span className="text-accent-text">{article.category}</span>
          </>
        )}
      </div>

      <EditorClient
        prNumber={article.pr_number}
        initialMarkdown={article.content_markdown}
      />
    </div>
  );
}
