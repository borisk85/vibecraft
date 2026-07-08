"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/lib/metadata";
import { heroFadeIn } from "@/lib/animations";

const proof = [
  { value: "Solo", label: "без посредников и бюрократии" },
  { value: "1–2 часа", label: "на ответ в рабочее время" },
  { value: "3 продукта", label: "в собственном продакшне" },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-32"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-accent blur-[120px]"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: [0.25, 0.35, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            ИИ-разработка.{" "}
            <span className="text-gradient">От идеи до продакшна.</span>
          </h1>

          <motion.p
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="mt-6 max-w-3xl text-pretty text-lg text-muted md:text-xl"
          >
            Собираю ботов, ИИ-агентов, ИИ-сайты, MVP веб- и мобильных
            приложений, автоматизации. Запускаю за недели, не месяцы, без
            бюджета большой студии.
          </motion.p>

          <motion.div
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.25}
            className="mt-10 flex flex-row items-center justify-center gap-3"
          >
            <a
              href="#contact"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-4 text-sm sm:text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)] sm:px-6"
            >
              Обсудить проект
            </a>

            <a
              href="#cases"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card/40 px-4 text-sm sm:text-base font-medium text-foreground transition-colors duration-150 hover:border-accent hover:bg-card sm:px-6"
            >
              Смотреть работы
            </a>
          </motion.div>

          <motion.dl
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.45}
            className="mt-10 flex flex-wrap items-center justify-center gap-y-3 text-sm text-muted"
          >
            {proof.map((item, index) => (
              <div
                key={item.label}
                className={`flex w-full items-baseline justify-center gap-2 md:w-auto md:px-8 ${
                  index > 0 ? "md:border-l md:border-border" : ""
                }`}
              >
                <dt className="font-mono text-base font-semibold text-foreground">
                  {item.value}
                </dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </Container>
    </section>
  );
}
