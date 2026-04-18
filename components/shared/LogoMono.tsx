import { cn } from "@/lib/utils";
import { V_PATH, V_VIEWBOX } from "@/lib/logo-path";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Монохромный логотип Vibecraft — векторизованный из Ideogram-референса.
 * Server Component. fill: #EDEDED. Геометрия в lib/logo-path.ts (единый
 * источник для LogoMono, LogoGradient, icon.tsx, apple-icon.tsx).
 */
export function LogoMono({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox={V_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vibecraft"
      role="img"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d={V_PATH} fill="#EDEDED" />
    </svg>
  );
}
