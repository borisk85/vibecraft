export const siteConfig = {
  name: "Vibecraft",
  title: "Vibecraft — AI-разработка в Алматы: Telegram-боты, MVP, автоматизации",
  description:
    "AI-разработка для малого и среднего бизнеса в Казахстане. Telegram-боты, SaaS, автоматизации и мобильные приложения за 2–4 недели — в 3 раза дешевле и в 5 раз быстрее классической студии.",
  url: "https://vibecraft.kz",
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
    "разработка на AI-стеке",
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
