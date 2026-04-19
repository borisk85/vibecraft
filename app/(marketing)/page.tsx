import { Hero } from "@/components/sections/Hero";
import { Pain } from "@/components/sections/Pain";
import { Solution } from "@/components/sections/Solution";
import { Services, services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { Cases } from "@/components/sections/Cases";
import { Stack } from "@/components/sections/Stack";
import { About } from "@/components/sections/About";
import { FAQ, faqs } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { siteConfig } from "@/lib/metadata";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vibecraft",
  url: siteConfig.url,
  logo: `${siteConfig.url}/og-image.png`,
  description:
    "AI-разработка в Казахстане: Telegram-боты, AI-ассистенты, MVP, SaaS, мобильные приложения и автоматизации.",
  founder: { "@type": "Person", name: "Борис" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Russian", "Kazakh"],
    url: siteConfig.contacts.telegram,
  },
  areaServed: ["Kazakhstan"],
  sameAs: [] as string[],
};

function priceFromLabel(label: string): string {
  return label.replace(/\D/g, "");
}

const serviceSchemas = services.map((service) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  provider: { "@type": "Organization", name: "Vibecraft" },
  name: service.title,
  description: service.description,
  areaServed: "Kazakhstan",
  offers: {
    "@type": "Offer",
    priceCurrency: "KZT",
    price: priceFromLabel(service.price),
  },
}));

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      {serviceSchemas.map((schema) => (
        <JsonLd key={schema.name} data={schema} />
      ))}
      <JsonLd data={faqSchema} />

      <Hero />
      <Pain />
      <Solution />
      <Services />
      <Process />
      <Cases />
      <Stack />
      <About />
      <FAQ />
      <FinalCTA />
    </>
  );
}
