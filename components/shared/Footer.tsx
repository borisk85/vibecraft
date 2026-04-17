import Link from "next/link";
import { Container } from "./Container";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border/60 py-12">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm font-semibold">vibecraft</span>
          <span className="text-sm text-subtle">
            AI-разработка и автоматизации · {siteConfig.location.city},{" "}
            {siteConfig.location.country}
          </span>
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

        <span className="text-xs text-subtle">© {year} Vibecraft</span>
      </Container>
    </footer>
  );
}
