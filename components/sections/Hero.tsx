"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/lib/metadata";
import { heroFadeIn } from "@/lib/animations";

const proof = [
  { value: "11 лет", label: "в собственных проектах" },
  { value: "3–4 дня", label: "на MVP в работе" },
  { value: "3 продукта", label: "в продакшне" },
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
            AI-разработка.{" "}
            <span className="text-gradient">От идеи до продакшна</span>
          </h1>

          <motion.p
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="mt-6 max-w-3xl text-pretty text-lg text-muted md:text-xl"
          >
            Собираю Telegram-боты, MVP, мобильные приложения и автоматизации
            на современном AI-стеке. Быстрее классических студий, с реальными
            кейсами в работе.
          </motion.p>

          <motion.div
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.25}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <motion.a
              href={siteConfig.contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                y: -2,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_40px_-8px_rgb(139_92_246/0.6)]"
            >
              Обсудить проект
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </motion.a>

            <a
              href="#cases"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-6 text-base font-medium text-foreground transition-colors duration-150 hover:border-accent hover:bg-card"
            >
              <PlayCircle className="h-4 w-4" />
              Смотреть кейсы
            </a>
          </motion.div>

          <motion.dl
            variants={heroFadeIn}
            initial="hidden"
            animate="visible"
            custom={0.45}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted sm:gap-x-10"
          >
            {proof.map((item) => (
              <div key={item.label} className="flex items-baseline gap-2">
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
