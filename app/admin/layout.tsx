import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const email = user.email?.toLowerCase() ?? "";
  // FAIL-CLOSED: пускаем ТОЛЬКО емейлы из allowlist. Если ADMIN_EMAILS пуст/не задан
  // на проде — в админку не попадает НИКТО (раньше пустой список открывал доступ
  // любому вошедшему по magic-link — дыра). Задать ADMIN_EMAILS в env Vercel.
  if (!ADMIN_EMAILS.includes(email)) {
    redirect("/login?error=forbidden");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-6 border-b border-white/10 px-6 py-4">
        <Link href="/admin/blog" className="text-lg font-bold">
          Vibecraft Admin
        </Link>
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/admin/blog" className="transition-colors hover:text-foreground">
            Блог
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted">
          <span>{email}</span>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-white/10 px-3 py-1 transition-colors hover:border-white/20 hover:text-foreground"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
