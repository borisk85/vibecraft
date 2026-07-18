"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";

const navLinks = [
  { href: "/#solution", label: "Подход" },
  { href: "/#process", label: "Процесс" },
  { href: "/#cases", label: "Работы" },
  { href: "/#about", label: "Обо мне" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Блог" },
];

const serviceLinks = [
  { href: "/uslugi/chat-boty", label: "Боты" },
  { href: "/uslugi/ai-agenty", label: "ИИ-агенты" },
  { href: "/uslugi/veb-prilozheniya", label: "MVP веб-приложений" },
  { href: "/uslugi/ai-sajty", label: "ИИ-сайты" },
  { href: "/uslugi/avtomatizacii", label: "Автоматизации" },
  { href: "/uslugi/mobilnye-prilozheniya", label: "MVP мобильных приложений" },
];

function NavLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", "/");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <Container as="div" className="flex h-16 items-center justify-between">
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 rounded-md font-mono text-sm font-semibold tracking-tight outline-none focus:outline-none focus-visible:outline-none"
          >
            <LogoMono className="h-8 w-8" />
            vibecraft
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <div className="group relative">
              <a
                href="/#services"
                className="flex items-center gap-1 text-sm text-muted transition-colors duration-150 hover:text-foreground"
              >
                Услуги
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="flex w-60 flex-col rounded-xl border border-border bg-card p-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)]">
                  {serviceLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <a
            href="/#contact"
            className="hidden h-10 items-center justify-center rounded-lg bg-gradient-accent px-4 text-sm font-medium text-white transition-shadow duration-200 hover:shadow-[0_0_24px_-8px_rgb(139_92_246/0.55)] lg:inline-flex"
          >
            Обсудить проект
          </a>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={isOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/40 text-foreground transition-colors duration-150 hover:border-accent lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Container>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
          >
            <Container
              as="div"
              className="flex h-16 items-center justify-end"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть меню"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/40 text-foreground transition-colors duration-150 hover:border-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </Container>

            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 pb-10 pt-6">
              <a
                href="/#services"
                onClick={() => setIsOpen(false)}
                className="py-3 text-2xl font-semibold tracking-tight text-foreground transition-colors duration-150 hover:text-accent-text"
              >
                Услуги
              </a>
              <div className="mb-2 flex flex-col gap-1 border-l border-border pl-4">
                {serviceLinks.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setIsOpen(false)}
                    className="py-1.5 text-base text-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-2xl font-semibold tracking-tight text-foreground transition-colors duration-150 hover:text-accent-text"
                >
                  {link.label}
                </NavLink>
              ))}

              <a
                href="/#contact"
                onClick={() => setIsOpen(false)}
                className="mt-6 inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white"
              >
                Обсудить проект
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
