"use client";

import { useEffect } from "react";

/*
  Убирает хеш из URL, когда пользователь скроллит обратно к Hero.
  Без этого: кликнули по "Кейсы" → URL стал /#cases → проскроллили
  наверх → URL остался /#cases, хотя визуально юзер на главной.
  IntersectionObserver на #hero → replaceState без хеша, когда Hero
  виден >50%.
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
      { threshold: 0.5 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return null;
}
