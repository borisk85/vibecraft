import { BLOG_CATEGORY_BY_NAME, DEFAULT_COVER } from "@/lib/blog-categories"

type Props = {
  category: string
  iconKey?: string
  large?: boolean
  className?: string
}

// Конфиг кавера (имя/цвет/иконка) — из единого источника lib/blog-categories.ts.
// Здесь ничего не хардкодим, чтобы имена категорий не расходились с BlogContent/услугами.
export default function PostCover({ category, large, className = "" }: Props) {
  const cfg = BLOG_CATEGORY_BY_NAME[category] ?? DEFAULT_COVER

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: cfg.coverBg }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${cfg.color}22 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: large ? 200 : 120,
          height: large ? 200 : 120,
          background: `${cfg.color}20`,
        }}
      />
      <div
        className="relative z-10"
        style={{
          color: cfg.color,
          opacity: 0.5,
          width: large ? 72 : 48,
          height: large ? 72 : 48,
        }}
        dangerouslySetInnerHTML={{ __html: cfg.coverIcon }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }}
      />
    </div>
  )
}
