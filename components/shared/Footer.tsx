import Link from "next/link";
import { Send } from "lucide-react";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 py-10 md:mt-24 md:py-12">
      <Container className="flex flex-col items-center gap-7 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-2">
          <div className="flex items-center gap-2">
            <LogoMono className="h-10 w-10 flex-shrink-0" />
            <span className="font-mono text-sm font-semibold">vibecraft</span>
          </div>
          <span className="text-sm text-subtle md:ml-1">
            AI-разработка и автоматизации · {siteConfig.location.city}
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 text-sm text-muted md:flex-row md:items-center md:gap-8">
          <Link
            href={siteConfig.contacts.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <Send className="h-4 w-4" />
            Telegram
          </Link>
          <a
            href={`mailto:${siteConfig.contacts.email}`}
            className="transition-colors hover:text-foreground"
          >
            {siteConfig.contacts.email}
          </a>
          <span className="text-sm text-subtle">© {year} Vibecraft</span>
        </div>
      </Container>
    </footer>
  );
}
