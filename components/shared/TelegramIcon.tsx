import { cn } from "@/lib/utils";

interface TelegramIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function TelegramIcon({ className, ...props }: TelegramIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Telegram"
      role="img"
      className={cn("h-4 w-4", className)}
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0 0 0 0 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.643.135-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
    </svg>
  );
}
