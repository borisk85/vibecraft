import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  servicePages,
  getServicePage,
  getServiceMeta,
} from "@/lib/services-pages";

export async function generateStaticParams() {
  return servicePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return { title: "Услуга не найдена" };
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: `/uslugi/${page.slug}` },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: `https://vibecraft.kz/uslugi/${page.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.seoDescription,
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();
  const meta = getServiceMeta(page.serviceTitle);

  const url = `https://vibecraft.kz/uslugi/${page.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.seoDescription,
    url,
    serviceType: page.serviceTitle,
    areaServed: [
      { "@type": "Country", name: "Казахстан" },
      { "@type": "City", name: "Алматы" },
      { "@type": "City", name: "Астана" },
    ],
    provider: {
      "@type": "Organization",
      name: "Vibecraft",
      url: "https://vibecraft.kz",
    },
    ...(meta?.price
      ? {
          offers: {
            "@type": "Offer",
            price: meta.price.replace(/[^\d]/g, ""),
            priceCurrency: "KZT",
            description: `${meta.price}, ${meta.duration}`,
          },
        }
      : {}),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://vibecraft.kz" },
      { "@type": "ListItem", position: 2, name: "Услуги", item: "https://vibecraft.kz/#services" },
      { "@type": "ListItem", position: 3, name: page.serviceTitle, item: url },
    ],
  };

  const related = servicePages.filter((p) => p.slug !== page.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />
      <main className="flex-1 py-24 md:py-32">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Хлебные крошки */}
            <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
              <Link href="/" className="transition-colors hover:text-foreground">
                Главная
              </Link>
              <span>/</span>
              <a href="/#services" className="transition-colors hover:text-foreground">
                Услуги
              </a>
              <span>/</span>
              <span className="text-foreground">{page.serviceTitle}</span>
            </nav>

            {/* Hero — above the fold */}
            <header className="mb-10">
              <h1 className="mb-4 text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">
                {page.h1}
              </h1>
              <p className="mb-6 text-lg text-muted leading-relaxed">
                {page.heroIntro}
              </p>
              {meta ? (
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <span className="font-mono text-lg font-medium text-foreground">
                    {meta.price}
                  </span>
                  <span className="text-sm text-subtle">{meta.duration}</span>
                </div>
              ) : null}
              <a
                href="/#contact"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
              >
                Обсудить проект
              </a>
            </header>

            {/* GEO-блок: прямой ответ первым */}
            <section className="mb-12 rounded-2xl border border-border bg-card/40 p-6 md:p-8">
              <p className="text-foreground/90 leading-relaxed">
                {page.geoAnswer}
              </p>
            </section>

            {/* Что входит */}
            <section className="mb-12">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">
                Что входит
              </h2>
              <ul className="flex flex-col gap-3">
                {page.included.map((item) => (
                  <li key={item} className="flex gap-3 text-muted leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Для кого */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
                Для кого
              </h2>
              <p className="text-muted leading-relaxed">{page.forWhom}</p>
            </section>

            {/* Цена и сроки */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
                Цена и сроки
              </h2>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
                <span className="font-mono text-lg font-medium text-foreground">
                  {meta?.price}
                </span>
                <span className="text-sm text-subtle">{meta?.duration}</span>
              </div>
            </section>

            {/* Почему Vibecraft / E-E-A-T */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
                Почему Vibecraft
              </h2>
              <p className="text-muted leading-relaxed">{page.why}</p>
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
                Частые вопросы
              </h2>
              <div className="flex flex-col gap-3">
                {page.faq.map((f) => (
                  <details
                    key={f.q}
                    className="rounded-xl border border-border bg-card/40 p-5"
                  >
                    <summary className="cursor-pointer select-none font-medium text-foreground">
                      {f.q}
                    </summary>
                    <p className="mt-3 text-muted leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="flex flex-col items-center gap-4 rounded-2xl border border-accent/30 bg-card/40 p-8 text-center md:p-10">
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Обсудим ваш проект?
              </h2>
              <p className="max-w-xl text-muted">
                Опишите задачу — AI-калькулятор посчитает стоимость и срок за
                минуту.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/#contact"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white"
                >
                  Обсудить проект
                </a>
                <Link
                  href="/calculator"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:border-accent"
                >
                  Посчитать стоимость
                </Link>
              </div>
            </section>

            {/* Перелинковка на related-услуги */}
            <section className="mt-14 border-t border-border pt-10">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted">
                Другие услуги
              </h2>
              <div className="flex flex-col gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/uslugi/${r.slug}`}
                    className="text-foreground transition-colors hover:text-accent-text"
                  >
                    {r.serviceTitle} →
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
