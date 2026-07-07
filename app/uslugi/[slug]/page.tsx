import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/shared/MotionSection";
import { FaqAccordion } from "@/components/shared/FaqAccordion";
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
    provider: { "@type": "Organization", name: "Vibecraft", url: "https://vibecraft.kz" },
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

  const related = servicePages.filter((p) => p.slug !== page.slug);

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <MotionSection className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-gradient-accent opacity-15 blur-[120px]"
          />
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
              <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-muted">
                <Link href="/" className="transition-colors hover:text-foreground">
                  Главная
                </Link>
                <span>/</span>
                <a href="/#services" className="transition-colors hover:text-foreground">
                  Услуги
                </a>
              </nav>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {page.h1}
              </h1>
              <p className="max-w-2xl text-pretty text-lg text-muted md:text-xl">
                {page.heroIntro}
              </p>
              {meta ? (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className="font-mono text-lg font-medium text-foreground">
                    {meta.price}
                  </span>
                  <span className="text-sm text-subtle">{meta.duration}</span>
                </div>
              ) : null}
              <a
                href="/#contact"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
              >
                Обсудить проект
              </a>
            </div>
          </Container>
        </MotionSection>

        {/* Иллюстрация услуги — брендовая SVG-схема, показывает суть наглядно */}
        <MotionSection className="pb-4 md:pb-6">
          <Container>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card">
              {/* SVG-иллюстрация из /public/uslugi: вектор, оптимизация next/image не нужна */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/uslugi/${page.slug}.svg`}
                alt={page.h1}
                width={1200}
                height={640}
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
          </Container>
        </MotionSection>

        {/* GEO-ответ + что входит + для кого + почему */}
        <MotionSection className="py-16 md:py-20">
          <Container>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
                <p className="text-lg text-foreground/90 leading-relaxed">
                  {page.geoAnswer}
                </p>
              </div>

              <h2 className="mb-6 mt-14 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Что входит
              </h2>
              <ul className="flex flex-col gap-4">
                {page.included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-foreground">
                    <Check className="mt-1 h-5 w-5 flex-shrink-0 text-accent-text" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mb-4 mt-14 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Для кого
              </h2>
              <p className="text-muted leading-relaxed">{page.forWhom}</p>

              <h2 className="mb-4 mt-14 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Почему Vibecraft
              </h2>
              <p className="text-muted leading-relaxed">{page.why}</p>
            </div>
          </Container>
        </MotionSection>

        {/* FAQ — как на сайте */}
        <MotionSection className="py-16 md:py-20">
          <Container>
            <SectionHeading eyebrow="FAQ" title="Частые вопросы" />
            <div className="mx-auto mt-14 max-w-3xl">
              <FaqAccordion items={page.faq} />
            </div>
          </Container>
        </MotionSection>

        {/* CTA — как FinalCTA */}
        <MotionSection className="py-16 md:py-20">
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-border bg-card/60 p-8 text-center backdrop-blur md:p-12">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
                Заявка
              </span>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Обсудим ваш проект?
              </h2>
              <p className="max-w-xl text-muted md:text-lg">
                Опишите задачу — предложу план, сроки и стоимость. Без долгих
                согласований.
              </p>
              <a
                href="/#contact"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-accent px-6 text-base font-medium text-white shadow-[0_0_30px_-10px_rgb(139_92_246/0.5)] transition-shadow duration-200 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.65)]"
              >
                Оставить заявку
              </a>
              <p className="text-sm text-muted">
                Не уверены в бюджете?{" "}
                <Link href="/calculator" className="text-accent-text hover:underline">
                  прикиньте стоимость в калькуляторе
                </Link>{" "}
                за минуту.
              </p>
            </div>
          </Container>
        </MotionSection>

        {/* Другие услуги — карточки как Services */}
        <MotionSection className="py-16 md:py-20">
          <Container>
            <SectionHeading eyebrow="Услуги" title="Другие направления" />
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const rMeta = getServiceMeta(r.serviceTitle);
                const Icon = rMeta?.icon;
                return (
                  <Link
                    key={r.slug}
                    href={`/uslugi/${r.slug}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-accent"
                  >
                    {Icon ? (
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                        <Icon className="h-5 w-5" />
                      </div>
                    ) : null}
                    <div>
                      <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-foreground">
                        {r.serviceTitle}
                      </h3>
                      {rMeta ? (
                        <p className="text-sm text-muted leading-relaxed">
                          {rMeta.price}, {rMeta.duration}
                        </p>
                      ) : null}
                    </div>
                    <span className="mt-auto text-sm text-accent-text transition-colors group-hover:text-foreground">
                      Подробнее →
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </MotionSection>
      </main>
      <Footer />
    </>
  );
}
