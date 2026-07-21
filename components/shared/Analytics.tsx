import Script from "next/script";

/*
  Аналитика: Яндекс.Метрика + GA4. Оба счетчика подключаются только если
  соответствующий NEXT_PUBLIC_*_ID задан — иначе ничего не рендерится.
  Скрипты грузятся через next/script с strategy="lazyOnload" — после
  полной загрузки страницы, чтобы счетчики не отъедали главный поток
  на первом экране (PageSpeed: 67 КиБ неиспользуемого JS).
*/

export function Analytics() {
  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!ymId && !gaId) return null;

  return (
    <>
      {ymId ? (
        <>
          <Script id="yandex-metrika" strategy="lazyOnload">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${ymId}, "init", {
                accurateTrackBounce: true,
                clickmap: true,
                trackLinks: true,
                webvisor: true
              });
            `}
          </Script>
          <noscript>
            <div>
              <img
                src={`https://mc.yandex.ru/watch/${ymId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      ) : null}

      {gaId ? (
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
      ) : null}
    </>
  );
}
