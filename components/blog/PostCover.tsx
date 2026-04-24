type Props = {
  category: string
  iconKey?: string
  large?: boolean
  className?: string
}

const COVER_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "Сравнения": {
    color: "#A78BFA",
    bg: "linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(139,92,246,0.06) 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/>
      <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/>
      <line x1="12" y1="3" x2="12" y2="21"/>
    </svg>`,
  },
  "Практика": {
    color: "#10B981",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(5,150,105,0.06) 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m9 12 2 2 4-4"/>
      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
      <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
      <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
    </svg>`,
  },
}

const DEFAULT = {
  color: "#A78BFA",
  bg: "linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(139,92,246,0.06) 100%)",
  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
