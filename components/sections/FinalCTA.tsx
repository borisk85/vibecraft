"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Send } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { MotionSection } from "@/components/shared/MotionSection";
import { siteConfig } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const projectTypes = [
  "Telegram-бот",
  "Мобильное приложение",
  "MVP / SaaS",
  "Автоматизация",
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
              Опишите задачу — отвечу за 1–2 часа
            </h2>
            <p className="max-w-xl text-muted md:text-lg">
              Просмотрю ваш запрос и свяжусь с вами для уточнения деталей.
              Предложу план, сроки и финальную стоимость для вашей задачи.
              Без долгих согласований и бюрократии.
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
                placeholder="Опишите задачу в нескольких предложениях"
                className="resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-none"
              />
            </div>

            <motion.button
              type="submit"
              disabled={state === "sending"}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]",
                state === "sending" && "opacity-70",
              )}
            >
              {state === "sending" ? "Отправляю…" : "Отправить заявку"}
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
            <span>Или напишите мне в мессенджер:</span>
            <Link
              href={siteConfig.contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors duration-150 hover:border-accent"
            >
              <Send className="h-4 w-4 text-accent-text" />
              Telegram
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
        className="h-11 rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-subtle transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-none"
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
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-4 text-left text-foreground transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-none"
        >
          <span className={cn(value ? "text-foreground" : "text-subtle")}>
            {value || "Выберите"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg shadow-black/40"
          >
            {options.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  setValue(opt);
                  setOpen(false);
                }}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-colors",
                  value === opt
                    ? "bg-surface text-foreground"
                    : "text-muted hover:bg-surface hover:text-foreground",
                )}
              >
                {opt}
              </li>
            ))}
          </ul>
        ) : null}
        <input type="hidden" name={name} value={value} />
      </div>
    </div>
  );
}
