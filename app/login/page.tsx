"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "sending" }
    | { type: "sent" }
    | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus({ type: "sending" });
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setStatus({ type: "error", message: error.message });
      } else {
        setStatus({ type: "sent" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      setStatus({ type: "error", message });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
        >
          ← На главную
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Вход
        </h1>

        {status.type === "sent" ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-success">
            Ссылка отправлена на <strong>{email}</strong>. Открой с того же
            устройства.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:placeholder:text-transparent focus:outline-none"
              disabled={status.type === "sending"}
            />
            <button
              type="submit"
              disabled={status.type === "sending"}
              className="rounded-xl bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status.type === "sending" ? "Отправляю..." : "Отправить ссылку"}
            </button>
            {status.type === "error" && (
              <div className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">
                {status.message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
