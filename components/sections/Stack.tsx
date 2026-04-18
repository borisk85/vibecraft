import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Supabase",
  "Railway",
  "Clerk",
  "Flutter",
  "Claude",
  "Make.com",
  "Telegram",
  "Tailwind",
  "Vercel",
  "Stripe",
];

export function Stack() {
  return (
    <MotionSection className="py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Стек"
          title="Технологии, которые использую"
          description="Стек подбираю под задачу, а не наоборот. Если у вас уже есть инфраструктура — работаю с тем, что есть."
        />

        <div className="mt-16 flex flex-wrap justify-center gap-2.5">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm text-muted transition-colors duration-150 hover:border-accent hover:text-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}
