import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const path = "M32 18 L46 18 L50 76 L54 18 L78 18 L50 88 L18 32 Z";

/**
 * Монохромный логотип Vibecraft — толстая V с треугольным срезом
 * в верхнем левом углу. Server Component, fill: #EDEDED.
 */
export function LogoMono({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vibecraft"
      role="img"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d={path} fill="#EDEDED" />
    </svg>
  );
}
