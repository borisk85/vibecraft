# Vibecraft

> AI development studio website. Solo founder building AI products end-to-end with Claude Code.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org) [![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)](https://tailwindcss.com) [![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

🌐 **Live:** [vibecraft.kz](https://vibecraft.kz)

## What it is

Marketing website for Vibecraft — a solo AI development studio based in Almaty, Kazakhstan. Showcases services (Telegram bots, AI agents, AI websites, MVP web/mobile apps, automations), case studies, and includes an AI-powered cost calculator that estimates project pricing and timeline from a plain-language description.

## Key features

- **AI cost calculator** (Claude API) — estimates project price and timeline from a natural language description in seconds; generates a PDF estimate and sends it via email
- **AI chat widget** (Claude API) — site-wide assistant that answers pre-sales questions
- **Case study showcase** with real production projects
- **Lead capture** integrated with Telegram Bot notifications + Resend email
- **Blog** with MDX content and a Supabase-backed admin editor
- **SEO-first**: JSON-LD schemas (Organization, Service, Article, FAQ, Breadcrumb), sitemap, robots.txt, OpenGraph + Twitter Card meta
- **Core Web Vitals optimized** — Server Components by default, no client-side JS on first screen

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI components | shadcn/ui + Lucide React |
| Animations | Framer Motion |
| AI | Claude API via `@anthropic-ai/sdk` |
| Database / Auth | Supabase |
| Email | Resend |
| Rate limiting | Upstash Redis |
| PDF generation | `@react-pdf/renderer` |
| Analytics | Yandex.Metrica + GA4 |
| Hosting | Vercel |

## Architecture highlights

**Route groups** — `app/(marketing)/` contains all public landing pages (home, calculator) and shares a marketing layout; `app/blog/` and `app/admin/` are separate.

**Server Components by default** — every page is a React Server Component unless interactivity is required. Client Components are isolated to leaf nodes (calculator form, chat widget, blog editor).

**AI endpoints:**
- `app/api/calculator/route.ts` — takes a project description, calls Claude to produce a structured JSON estimate, generates a PDF, sends it via Resend, and notifies via Telegram. Rate-limited to 5 requests/hour per IP using Upstash Redis.
- `app/api/chat/route.ts` — streaming Claude conversation for the site chat widget with a pre-sales system prompt.

**Lead pipeline** — `app/api/contact/route.ts` and `app/api/lead/route.ts` forward form submissions to a Telegram chat in real time (no CRM needed at this stage).

**Blog admin** — `app/admin/blog/` is a Supabase-authenticated editor built with BlockNote. Blog posts are stored in Supabase and rendered as static pages.

**PDF estimates** — `@react-pdf/renderer` with Inter font loaded over HTTP and SVG logo path, normalizes Cyrillic with NFC before rendering to avoid glyph issues.

## Local setup

```bash
git clone https://github.com/borisk85/vibecraft
cd vibecraft
npm install
cp .env.example .env.local
# Fill in API keys — see .env.example for descriptions
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Required keys to run locally:**
- `ANTHROPIC_API_KEY` — for calculator and chat
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for blog and auth
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — for lead notifications

Everything else (Resend, Upstash, analytics) is optional and degrades gracefully.

## About the studio

Vibecraft is a solo AI development practice. Specializes in building production AI products in 1–2 weeks instead of months, using Claude as the core AI layer across both development and the products themselves.

Currently shipping three products in production:
- [Velabot](https://velabot.io) — SaaS for no-code AI Telegram bots
- [Duet](https://duetaiapp.com) — AI sommelier mobile app
- [Personal AI Assistant](https://github.com/borisk85/tg-bot) — Telegram bot with 20+ tools

## Contact

- 🌐 Site: [vibecraft.kz](https://vibecraft.kz)
- ✉️ Email: bkomarov85@gmail.com
- 💬 Telegram: [@borisk85](https://t.me/borisk85)
- 💼 LinkedIn: [boriskomarov](https://www.linkedin.com/in/boriskomarov/)

---

*Source code published as portfolio. Closed contributions.*
