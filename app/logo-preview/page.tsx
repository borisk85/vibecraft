import type { Metadata } from "next";
import { LogoMono } from "@/components/shared/LogoMono";
import { LogoGradient } from "@/components/shared/LogoGradient";

export const metadata: Metadata = {
  title: "Logo preview",
  robots: { index: false, follow: false },
};

const sizes = [
  { label: "h-8", className: "h-8 w-8" },
  { label: "h-12", className: "h-12 w-12" },
  { label: "h-24", className: "h-24 w-24" },
  { label: "h-32", className: "h-32 w-32" },
] as const;

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-background px-8 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Logo preview
        </h1>
        <p className="mb-12 text-sm text-muted">
          Временная страница для визуальной проверки геометрии логотипа. Не индексируется.
        </p>

        <div className="mb-16">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
            Monochrome · #EDEDED
          </h2>
          <div className="flex flex-wrap items-end gap-10 rounded-2xl border border-border bg-surface p-10">
            {sizes.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-3">
                <LogoMono className={s.className} />
                <span className="font-mono text-xs text-subtle">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
            Gradient · 135° · #8B5CF6 → #EC4899
          </h2>
          <div className="flex flex-wrap items-end gap-10 rounded-2xl border border-border bg-surface p-10">
            {sizes.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-3">
                <LogoGradient
                  className={s.className}
                  idSuffix={`preview-${s.label}`}
                />
                <span className="font-mono text-xs text-subtle">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
            Side-by-side · h-24
          </h2>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-10">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-8">
              <LogoMono className="h-24 w-24" />
              <span className="font-mono text-xs text-subtle">Mono</span>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-8">
              <LogoGradient className="h-24 w-24" idSuffix="side-by-side" />
              <span className="font-mono text-xs text-subtle">Gradient</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
