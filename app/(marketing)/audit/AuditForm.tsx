"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type State = "idle" | "sending" | "sent" | "already" | "error";

export function AuditForm() {
  const [state, setState] = useState<State>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    try {
      const res = await fetch("/api/audit-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { ok: boolean; duplicate?: boolean };
      setState(data.duplicate ? "already" : "sent");
      (e.target as HTMLFormElement).reset();
    } catch {
      setState("error");
    }
  };

  if (state === "sent" || state === "already") {
    return (
      <p className="text-base text-success md:text-lg">
        {state === "already"
          ? "Вы уже в списке. Напишу, когда инструмент будет готов."
          : "Спасибо. Напишу, когда инструмент будет готов."}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.kz"
        className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className={cn(
          "inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_40px_-8px_rgb(139_92_246/0.6)]",
          state === "sending" && "opacity-70",
        )}
      >
        {state === "sending" ? "Отправляю…" : "Уведомить меня"}
      </button>
      {state === "error" ? (
        <p className="basis-full text-center text-sm text-error">
          Не получилось отправить. Попробуйте позже.
        </p>
      ) : null}
    </form>
  );
}
