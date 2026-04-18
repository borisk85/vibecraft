"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { siteConfig } from "@/lib/metadata";

const navLinks = [
  { href: "#solution", label: "Подход" },
  { href: "#services", label: "Услуги" },
  { href: "#process", label: "Процесс" },
  { href: "#cases", label: "Кейсы" },
  { href: "#about", label: "Обо мне" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Блог" },
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
  if (href.startsWith("#")) {
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <Container as="div" className="flex h-16 items-center justify-between">
        <a
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight"
        >
          <LogoMono className="h-8 w-8" />
          vibecraft
        </a>

        <nav className="hidden items-center gap-8 md:flex">
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

        <motion.a
          href={siteConfig.contacts.telegram}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{
            y: -2,
            transition: { duration: 0.15, ease: "easeOut" },
          }}
          className="hidden h-10 items-center justify-center rounded-lg bg-gradient-accent px-4 text-sm font-medium text-white md:inline-flex"
        >
          Обсудить проект
        </motion.a>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={isOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/40 text-foreground transition-colors duration-150 hover:border-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </Container>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
          >
            <Container
              as="div"
              className="flex h-16 items-center justify-between border-b border-border/60"
            >
              <a
                href="/"
                onClick={handleLogoClick}
                className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight"
              >
                <LogoMono className="h-8 w-8" />
                vibecraft
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть меню"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/40 text-foreground transition-colors duration-150 hover:border-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </Container>

            <nav className="flex flex-1 flex-col gap-2 px-6 pt-10">
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
                href={siteConfig.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white"
              >
                Обсудить проект
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
