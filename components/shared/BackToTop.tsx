"use client";

import { ArrowUp } from "lucide-react";

/*
  Кнопка "Наверх" в Footer. Работает cross-route: на главной
  скроллит к верху (HashCleaner уберёт #hash из URL), на /blog
  и других страницах — к началу текущего документа.
*/
export function BackToTop() {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-foreground"
    >
      <ArrowUp className="h-4 w-4" />
      Наверх
    </button>
  );
}
