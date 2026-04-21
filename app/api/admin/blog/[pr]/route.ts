// GET — читает content статьи из lib/blog-posts.ts на ветке PR
// PUT — сохраняет новый content в ту же ветку
import { NextRequest, NextResponse } from "next/server";
import { extractArticle, replaceContent } from "@/lib/blog-posts-parser";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO =
  process.env.GITHUB_REPO_VIBECRAFT ?? "borisk85/vibecraft";
const BLOG_POSTS_PATH = "lib/blog-posts.ts";

async function ensureAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 as const };
  const email = user.email?.toLowerCase() ?? "";
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    return { ok: false, status: 403 as const };
  }
  return { ok: true as const };
}

async function fetchPR(prNumber: number) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`PR fetch failed: ${res.status}`);
  return res.json();
}

async function fetchFile(branch: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${BLOG_POSTS_PATH}?ref=${branch}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`File fetch failed: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pr: string }> },
) {
  const gate = await ensureAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: "Not authorized" }, { status: gate.status });
  }
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not set" },
      { status: 500 },
    );
  }
  try {
    const { pr } = await ctx.params;
    const prNumber = parseInt(pr, 10);
    const prData = await fetchPR(prNumber);
    const branch = prData.head.ref;
    const slug = branch.replace(/^article\//, "");
    const { content: blogTs, sha } = await fetchFile(branch);
    const article =
      extractArticle(blogTs, slug) ??
      extractArticle(blogTs, slug.replace(/-\d{4,6}$/, ""));
    if (!article) {
      return NextResponse.json(
        { error: `Статья со slug ${slug} не найдена в файле` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      pr_number: prNumber,
      branch,
      slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      iconKey: article.iconKey,
      content_markdown: article.content,
      sha,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ pr: string }> },
) {
  const gate = await ensureAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: "Not authorized" }, { status: gate.status });
  }
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not set" },
      { status: 500 },
    );
  }
  try {
    const { pr } = await ctx.params;
    const prNumber = parseInt(pr, 10);
    const { content_markdown } = (await req.json()) as {
      content_markdown: string;
    };
    if (!content_markdown) {
      return NextResponse.json(
        { error: "content_markdown required" },
        { status: 400 },
      );
    }

    const prData = await fetchPR(prNumber);
    const branch = prData.head.ref;
    const slug = branch.replace(/^article\//, "");
    const { content: blogTs, sha } = await fetchFile(branch);

    // Проверяем что статья существует и какой именно slug в файле
    let actualSlug = slug;
    if (!extractArticle(blogTs, slug)) {
      const shortSlug = slug.replace(/-\d{4,6}$/, "");
      if (extractArticle(blogTs, shortSlug)) {
        actualSlug = shortSlug;
      } else {
        return NextResponse.json(
          { error: `Статья ${slug} не найдена` },
          { status: 404 },
        );
      }
    }

    const updatedTs = replaceContent(blogTs, actualSlug, content_markdown);
    if (updatedTs === blogTs) {
      return NextResponse.json(
        { error: "Не получилось патчить файл" },
        { status: 500 },
      );
    }

    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${BLOG_POSTS_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `edit: update content of ${actualSlug} via web admin`,
          content: Buffer.from(updatedTs, "utf-8").toString("base64"),
          sha,
          branch,
        }),
      },
    );
    if (!commitRes.ok) {
      const text = await commitRes.text();
      return NextResponse.json(
        { error: `commit failed: ${text}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
