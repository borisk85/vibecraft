import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/metadata";
import { MotionProvider } from "@/components/shared/MotionProvider";
import { Analytics } from "@/components/shared/Analytics";
import { ChatWidgetMount } from "@/components/shared/ChatWidgetMount";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    yandex: "9196b415f8ba7deb",
    google: "o0DZ87t1PIZRkKzVSbQTJaRuepF9OgzuNgc4Gnx2oYQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://vibecraft.kz/#website",
  url: "https://vibecraft.kz",
  name: "Vibecraft",
  description: siteConfig.description,
  inLanguage: "ru-KZ",
  publisher: { "@type": "Organization", name: "Vibecraft", url: "https://vibecraft.kz" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // .trim() критично: значение env-переменной может прийти с переносом строки,
  // и тогда незакрытая строка в инлайн-скрипте роняет его («Invalid token»).
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

  return (
    <html
      lang="ru"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <MotionProvider>{children}</MotionProvider>
        <ChatWidgetMount />
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        {clarityId && (
          <Script id="ms-clarity" strategy="lazyOnload">{`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}</Script>
        )}
      </body>
    </html>
  );
}
