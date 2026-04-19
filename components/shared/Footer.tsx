import Link from "next/link";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { BackToTop } from "./BackToTop";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 py-10 md:mt-24 md:py-12">
      <Container className="flex flex-col items-center gap-7 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-3">
          <LogoMono className="h-12 w-12 flex-shrink-0 md:h-10 md:w-10" />
          <div className="flex flex-col gap-1 md:gap-0">
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
