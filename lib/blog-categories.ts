// Единый источник правды для категорий блога.
// Имена — во МН.Ч., в один ряд с услугами в components/sections/Services.tsx
// (Боты, Автоматизации, Приложения). НЕ хардкодить имена категорий в других файлах:
// PostCover, BlogContent и т.д. берут их ОТСЮДА, чтобы имя/цвет/иконка не расходились
// (частая ошибка — «Автоматизация» ед.ч. в одном месте и «Автоматизации» в другом).

export type BlogCategory = {
  name: string // отображаемое имя = post.category (по нему идет фильтр и подбор кавера)
  slug: string // для URL-фильтра ?cat=
  color: string // = post.categoryColor
  coverBg: string
  coverIcon: string // inline SVG для кавера
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    name: "Боты",
    slug: "bots",
    color: "#8B5CF6",
    coverBg: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.06) 100%)",
    coverIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>`,
  },
  {
    name: "Автоматизации",
    slug: "automation",
    color: "#10B981",
    coverBg: "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(5,150,105,0.06) 100%)",
    coverIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="8" height="8" x="3" y="3" rx="2"/>
      <path d="M7 11v4a2 2 0 0 0 2 2h4"/>
      <rect width="8" height="8" x="13" y="13" rx="2"/>
    </svg>`,
  },
  {
    name: "Приложения",
    slug: "apps",
    color: "#EC4899",
    coverBg: "linear-gradient(135deg, rgba(236,72,153,0.14) 0%, rgba(219,39,119,0.06) 100%)",
    coverIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 8h20"/>
      <path d="M6 6h.01"/>
      <path d="M10 6h.01"/>
    </svg>`,
  },
]

export const BLOG_CATEGORY_BY_NAME: Record<string, BlogCategory> = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.name, c]),
)

// Запасной кавер (нейтральный документ, НЕ звезда) — только если появится
// категория без своей записи выше. Все текущие категории заданы, DEFAULT не показывается.
export const DEFAULT_COVER = {
  color: "#8B5CF6",
  coverBg: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.06) 100%)",
  coverIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>`,
}
