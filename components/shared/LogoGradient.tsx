"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { V_PATH, V_VIEWBOX } from "@/lib/logo-path";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Градиентный логотип Vibecraft — векторизованный из Ideogram-референса.
 * Client-компонент из-за useId: несколько экземпляров на странице требуют
 * уникальный gradient ID (иначе в Safari/iOS все кроме первого — черные).
 */
export function LogoGradient({ className, ...props }: LogoProps) {
  const gradientId = useId();
  return (
    <svg
      viewBox={V_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vibecraft"
      role="img"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path d={V_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}
