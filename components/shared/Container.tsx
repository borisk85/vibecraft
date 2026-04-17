import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "header" | "footer" | "main" | "article";
}

export function Container({
  className,
  as: Tag = "div",
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full max-w-6xl px-6 md:px-10", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
