export const siteConfig = {
  name: "Vibecraft",
  title: "Vibecraft — AI-разработка и автоматизации в Казахстане",
  description:
    "Боты, ИИ-агенты, AI-сайты, MVP веб- и мобильных приложений, автоматизации. Под ключ за 1-2 недели.",
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
    "разработка с Claude",
  ],
  contacts: {
    telegram: "https://t.me/borisk85",
    telegramHandle: "@borisk85",
    linkedin: "https://www.linkedin.com/in/boriskomarov/",
    instagram: "https://www.instagram.com/bkomarov85/",
    facebook: "https://www.facebook.com/bkomarov85",
    email: "hello@vibecraft.kz",
  },
  location: {
    city: "Алматы",
    country: "Казахстан",
    countryCode: "KZ",
  },
} as const;

export type SiteConfig = typeof siteConfig;
