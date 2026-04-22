"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { Plus } from "lucide-react";
import { faqs } from "@/lib/faqs";

const nodeOverrides: Record<string, React.ReactNode> = {
  "Что такое аудит скорости сайта?": (
    <>
      Бесплатный инструмент на базе Google PageSpeed Insights — запускаем
      скоро. Введете URL — увидите главные проблемы скорости и
      приоритизированный план исправлений. Оставить email для уведомления о
      запуске можно на странице{" "}
      <Link
        href="/audit"
        className="text-accent-text underline-offset-4 hover:underline"
      >
        /audit
      </Link>
      .
    </>
  ),
};

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openIndex]);

  return (
    <MotionSection id="faq" className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Частые вопросы"
          description="Если что-то осталось непонятным — напишите мне в Telegram, отвечу лично."
        />

        <div
          ref={containerRef}
          className="mx-auto mt-16 max-w-3xl divide-y divide-border border-y border-border"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.q} className="group relative py-6">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start justify-between gap-6 text-left"
                >
                  <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-accent-text">
                    {faq.q}
                  </h3>
                  <Plus
                    className={`mt-1 h-5 w-5 flex-shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.2, ease: "easeOut" },
                      }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-muted leading-relaxed">
                        {nodeOverrides[faq.q] ?? faq.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </MotionSection>
  );
}
