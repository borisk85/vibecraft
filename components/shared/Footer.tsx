import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border/60 py-12">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LogoMono className="h-10 w-10 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold">vibecraft</span>
            <span className="text-sm text-subtle">
              AI-разработка и автоматизации · {siteConfig.location.city},{" "}
              {siteConfig.location.country}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted md:flex-row md:items-center md:gap-6">
          <Link
            href={siteConfig.contacts.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Telegram {siteConfig.contacts.telegramHandle}
          </Link>
          <a
            href={`mailto:${siteConfig.contacts.email}`}
            className="transition-colors hover:text-foreground"
          >
            {siteConfig.contacts.email}
          </a>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="#hero"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors duration-150 hover:text-foreground"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Наверх
          </a>
          <span className="text-xs text-subtle">© {year} Vibecraft</span>
        </div>
      </Container>
    </footer>
  );
}
