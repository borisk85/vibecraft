import Script from "next/script";

/*
  Аналитика: GA4. Счетчик подключается только если NEXT_PUBLIC_GA_ID задан,
  иначе ничего не рендерится. Скрипт грузится через next/script с
  strategy="lazyOnload", после полной загрузки страницы, чтобы счетчик не
  отъедал главный поток на первом экране (PageSpeed: 67 КиБ неиспользуемого JS).
  Яндекс.Метрика удалена 27.07.2026 по команде Boris: счетчик так и не завели,
  ключа на проде не было, код висел мертвым.
*/

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
