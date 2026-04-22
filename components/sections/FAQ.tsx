"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { Plus } from "lucide-react";
import { faqs } from "@/lib/faqs";

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
                <div className="flex w-full items-start justify-between gap-6 text-left">
                  <h3
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        window.getSelection()?.toString()
                      ) {
                        return;
                      }
                      setOpenIndex(isOpen ? null : index);
                    }}
                    className="flex-1 cursor-pointer select-text text-lg font-medium text-foreground transition-colors group-hover:text-accent-text"
                  >
                    {faq.q}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        window.getSelection()?.toString()
                      ) {
                        window.getSelection()?.removeAllRanges();
                      }
                      setOpenIndex(isOpen ? null : index);
                    }}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Свернуть" : "Развернуть"}
                    className="flex-shrink-0 cursor-pointer p-1 -m-1"
                  >
                    <Plus
                      className={`mt-1 h-5 w-5 text-muted transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                </div>
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
                        {faq.a}
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
