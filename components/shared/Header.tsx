"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { siteConfig } from "@/lib/metadata";

const navLinks = [
  { href: "#services", label: "Услуги" },
  { href: "#cases", label: "Кейсы" },
  { href: "#process", label: "Процесс" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Блог" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <Container
        as="div"
        className="flex h-16 items-center justify-between"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight"
        >
          <LogoMono className="h-8 w-8" />
          vibecraft
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
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
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-accent px-4 text-sm font-medium text-white"
        >
          Обсудить проект
        </motion.a>
      </Container>
    </header>
  );
}
