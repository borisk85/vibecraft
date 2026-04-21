// Список открытых PR со статьями (ветка article/*) в borisk85/vibecraft
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO =
  process.env.GITHUB_REPO_VIBECRAFT ?? "borisk85/vibecraft";

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

export async function GET() {
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

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/pulls?state=open&per_page=50`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `GitHub API ${res.status}` },
      { status: 500 },
    );
  }

  type GitHubPR = {
    number: number;
    title: string;
    head: { ref: string };
    html_url: string;
    created_at: string;
  };
  const prs = (await res.json()) as GitHubPR[];
  const articles = prs
    .filter((pr) => pr.head?.ref?.startsWith("article/"))
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      branch: pr.head.ref,
      slug: pr.head.ref.replace(/^article\//, ""),
      url: pr.html_url,
      created_at: pr.created_at,
    }));

  return NextResponse.json({ articles });
}
