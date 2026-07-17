type Props = {
  category: string
  iconKey?: string
  large?: boolean
  className?: string
}

const COVER_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "Боты": {
    color: "#8B5CF6",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.06) 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>`,
  },
  "Автоматизации": {
    color: "#10B981",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(5,150,105,0.06) 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="8" height="8" x="3" y="3" rx="2"/>
      <path d="M7 11v4a2 2 0 0 0 2 2h4"/>
      <rect width="8" height="8" x="13" y="13" rx="2"/>
    </svg>`,
  },
  "Приложения": {
    color: "#EC4899",
    bg: "linear-gradient(135deg, rgba(236,72,153,0.14) 0%, rgba(219,39,119,0.06) 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 8h20"/>
      <path d="M6 6h.01"/>
      <path d="M10 6h.01"/>
    </svg>`,
  },
}

// DEFAULT — нейтральный документ (НЕ звезда). Все категории замаплены выше,
// поэтому DEFAULT показывается только если появится новая категория без иконки.
const DEFAULT = {
  color: "#8B5CF6",
  bg: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.06) 100%)",
  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>`,
}

export default function PostCover({ category, large, className = "" }: Props) {
  const cfg = COVER_CONFIG[category] ?? DEFAULT

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: cfg.bg }}
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
        dangerouslySetInnerHTML={{ __html: cfg.icon }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }}
      />
    </div>
  )
}
