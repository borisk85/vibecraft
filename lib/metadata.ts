export const siteConfig = {
  name: "Vibecraft",
  title: "Vibecraft — AI-разработка в Казахстане",
  description:
    "Telegram-боты, AI-ассистенты, MVP, SaaS, мобильные приложения и автоматизации в Казахстане.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecraft.kz",
  author: "Vibecraft",
  locale: "ru_KZ",
  keywords: [
    "AI-разработка",
    "AI-разработка Казахстан",
    "Telegram-бот Алматы",
    "разработка Telegram-ботов",
    "MVP разработка",
    "Next.js разработка",
    "автоматизация бизнеса",
    "Make.com сценарии",
    "чат-бот с ChatGPT",
    "Flutter разработка Казахстан",
    "Supabase SaaS",
    "разработка с Claude",
  ],
  contacts: {
    telegram: "https://t.me/borisk85",
    telegramHandle: "@borisk85",
    instagram: "https://instagram.com/vibecraft",
    email: "hello@vibecraft.kz",
  },
  location: {
    city: "Алматы",
    country: "Казахстан",
    countryCode: "KZ",
  },
} as const;

export type SiteConfig = typeof siteConfig;
