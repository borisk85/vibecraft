import Link from "next/link";
import { Facebook, Instagram, Linkedin, Send } from "lucide-react";
import { Container } from "./Container";
import { LogoMono } from "./LogoMono";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 py-10 md:mt-24 md:py-12">
      <Container className="flex flex-col items-center gap-7 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-2">
          <div className="flex items-center gap-2 translate-x-[3px]">
            <LogoMono className="h-10 w-10 flex-shrink-0" />
            <span className="font-mono text-sm font-semibold">vibecraft</span>
          </div>
          <span className="text-sm text-subtle md:ml-1">
            AI-разработка и автоматизации · {siteConfig.location.city}
          </span>
        </div>

        <div className="flex flex-col items-center gap-5 text-sm text-muted md:flex-row md:items-center md:gap-8">
          <div className="flex items-center gap-5">
            <Link
              href={siteConfig.contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="transition-colors hover:text-foreground"
            >
              <Send className="h-5 w-5" />
            </Link>
            <Link
              href={siteConfig.contacts.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition-colors hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href={siteConfig.contacts.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-colors hover:text-foreground"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href={siteConfig.contacts.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition-colors hover:text-foreground"
            >
              <Facebook className="h-5 w-5" />
            </Link>
          </div>
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
