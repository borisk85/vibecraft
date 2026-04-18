"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { MotionSection } from "@/components/shared/MotionSection";
import { siteConfig } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const projectTypes = [
  "Telegram-бот",
  "Автоматизация",
  "MVP SaaS",
  "Мобильное приложение",
  "Парсинг",
  "Другое",
];

const budgets = [
  "до 200 000 ₸",
  "200 000 – 500 000 ₸",
  "500 000 – 1 500 000 ₸",
  "от 1 500 000 ₸",
];

export function FinalCTA() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setState("sent");
      (e.target as HTMLFormElement).reset();
    } catch {
      setState("error");
    }
  };

  return (
    <MotionSection
      id="contact"
      className="relative overflow-hidden py-24 md:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-accent opacity-15 blur-[120px]"
      />

      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/60 p-8 backdrop-blur md:p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              Заявка
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Опишите задачу — отвечу в течение дня
            </h2>
            <p className="max-w-xl text-muted md:text-lg">
              Отвечу, уточню детали и вернусь с планом, сроком и стоимостью.
              Без шаблонов и долгих согласований.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Имя"
                name="name"
                placeholder="Как к вам обращаться"
                required
              />
              <Field
                label="Telegram или email"
                name="contact"
                placeholder="@username или mail@example.kz"
                required
              />
            </div>

            <SelectField label="Тип проекта" name="type" options={projectTypes} />
            <SelectField label="Бюджет" name="budget" options={budgets} />

            <div className="flex flex-col gap-2">
              <label htmlFor="field-message" className="text-sm text-muted">
                Коротко о задаче
              </label>
              <textarea
                id="field-message"
                name="message"
                rows={4}
                placeholder="Опишите задачу в 2–3 предложениях"
                className="resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none"
              />
            </div>

            <motion.button
              type="submit"
              disabled={state === "sending"}
              whileHover={{
                y: -2,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              className={cn(
                "group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_40px_-8px_rgb(139_92_246/0.6)]",
                state === "sending" && "opacity-70",
              )}
            >
              {state === "sending" ? "Отправляю…" : "Отправить заявку"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </motion.button>

            {state === "sent" ? (
              <p className="text-center text-sm text-success">
                Спасибо. Отвечу в Telegram или на почту в ближайшее время.
              </p>
            ) : null}
            {state === "error" ? (
              <p className="text-center text-sm text-error">
                Не получилось отправить. Напишите напрямую в Telegram —{" "}
                <Link
                  href={siteConfig.contacts.telegram}
                  className="underline"
                >
                  {siteConfig.contacts.telegramHandle}
                </Link>
                .
              </p>
            ) : null}
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-8 text-sm text-muted md:flex-row md:justify-center md:gap-6">
            <span>Или сразу в мессенджер:</span>
            <Link
              href={siteConfig.contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground transition-colors duration-150 hover:text-accent-text"
            >
              <Send className="h-4 w-4" />
              Telegram {siteConfig.contacts.telegramHandle}
            </Link>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
        {required ? <span className="text-accent-text"> *</span> : null}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  const id = `select-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue=""
        className="h-11 rounded-lg border border-border bg-background px-4 text-foreground transition-colors duration-150 focus:border-accent focus:outline-none"
      >
        <option value="" disabled>
          Выберите
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
