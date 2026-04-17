import { cn } from "@/lib/utils";

interface LogoGradientProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  /**
   * Суффикс для ID градиента. Нужен, когда на одной странице несколько
   * экземпляров LogoGradient — SVG-gradient ID обязан быть уникальным
   * (иначе в Safari/iOS все кроме первого рендерятся чёрными).
   *
   * Примеры: "hero", "footer", "cta". Дефолт — "default".
   */
  idSuffix?: string;
}

const path = "M30 25 L40 25 L50 68 L60 25 L78 25 L50 82 L22 33 Z";

/**
 * Градиентный логотип Vibecraft — фиолетово-розовый градиент 135°.
 * Server Component (быстрее и без hydration delay).
 * При использовании нескольких экземпляров на странице передавайте idSuffix.
 */
export function LogoGradient({
  className,
  idSuffix = "default",
  ...props
}: LogoGradientProps) {
  const gradientId = `vibecraft-gradient-${idSuffix}`;
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vibecraft"
      role="img"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gradientId})`} />
    </svg>
  );
}
