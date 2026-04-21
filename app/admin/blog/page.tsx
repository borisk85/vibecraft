import Link from "next/link";
import { headers } from "next/headers";

type Article = {
  number: number;
  title: string;
  branch: string;
  slug: string;
  url: string;
  created_at: string;
};

async function getArticles(): Promise<Article[]> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/admin/blog`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") ?? "" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.articles ?? [];
}

export default async function AdminBlogPage() {
  const articles = await getArticles();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Черновики статей блога</h1>
      <p className="mb-8 text-sm text-muted">
        Открытые PR со статьями. Кликни на статью чтобы открыть визуальный
        редактор.
      </p>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-12 text-center text-muted">
          Сейчас нет открытых черновиков статей.
          <br />
          Сгенерируй новую через @velamarketing_bot — /project vibecraft →
          /article
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => (
            <Link
              key={a.number}
              href={`/admin/blog/${a.number}`}
              className="block rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs text-muted">PR #{a.number}</div>
                  <div className="mb-1 truncate font-semibold text-foreground">
                    {a.title}
                  </div>
                  <div className="truncate text-xs text-subtle">{a.slug}</div>
                </div>
                <div className="shrink-0 text-xs text-subtle">
                  {new Date(a.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
