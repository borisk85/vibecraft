"use client";

import { useEffect } from "react";

/*
  Убирает хеш из URL, когда пользователь скроллит обратно к Hero.
  Без этого: кликнули по "Кейсы" → URL стал /#cases → проскроллили
  наверх → URL остался /#cases, хотя визуально юзер на главной.
  IntersectionObserver на #hero → replaceState без хеша, когда Hero
  виден >90% (юзер реально на самом верху). Порог именно 90%, а не 50%:
  при клике на близкую к верху секцию Hero еще оставался бы в кадре на
  50%, и ссылка на секцию мгновенно схлопывалась бы в чистый /. С 90%
  прямые якорные ссылки живут, а «грязь» при возврате наверх убирается.
*/
export function HashCleaner() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }

    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && window.location.hash) {
            history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
          }
        }
      },
      { threshold: 0.9 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return null;
}
