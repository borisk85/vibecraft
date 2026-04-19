import Link from "next/link";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { BackToTop } from "./BackToTop";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border/60 py-12">
      <Container className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
          <LogoMono className="h-14 w-14 flex-shrink-0 md:h-10 md:w-10" />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold">vibecraft</span>
            <span className="text-sm text-subtle">
              AI-разработка и автоматизации · {siteConfig.location.city},{" "}
              {siteConfig.location.country}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm text-muted md:flex-row md:items-center md:gap-6">
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
          <BackToTop />
          <span className="text-xs text-subtle">© {year} Vibecraft</span>
        </div>
      </Container>
    </footer>
  );
}
