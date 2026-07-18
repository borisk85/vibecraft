# STATE — Vibecraft (vibecraft.kz)
Обновлено: 2026-07-18

## ПРАВИЛА ЭТОГО ФАЙЛА
- Единственное место рабочих заметок и памяти между сессиями.
- Читаю в начале каждой сессии, обновляю после каждого этапа.
- В работе всегда ровно одна задача.

## В РАБОТЕ (ровно 1)
- [ ] Миграция проекта на BASE_RULES + STATE.md (скил project-migrate)

## ОЧЕРЕДЬ (по порядку) — из плана памяти 2026-06-15, не из git
1. +2 услуги: GEO (оптимизация под AI-поиск) и Speed Boost (Core Web Vitals) в Services.tsx + калькулятор. Цены не подтверждены.
2. Статичные SEO-страницы услуг (/uslugi/telegram-boty и т.п.) на 6 направлений.
3. SEO-статьи под ключи из docs/seo-keywords-2026-07.md (пишет vela-marketing-bot -> PR -> /admin/blog).

## СДЕЛАНО (с датой, новое сверху)
- [2026-07-18] Блог: таблицы #1/#3 в house-формат, ToC-ссылки белым, статья #5 (запись клиентов), чистка языка
- [2026-07-18] Хуки: перенос защитного набора (3->44+), текст-линты слиты в check_chat_lint
- [2026-07-17] Security-заголовки в next.config
- [ранее] Лендинг финализирован, калькулятор+PDF+email, блог-инфра (категории Боты/Автоматизации/Приложения)

## КОНТЕКСТ ПРОЕКТА (кратко, только факты)
- Стек: Next.js 16.2.4 (App Router) + React 19.2 + TS 5 + Tailwind 4. Supabase, @anthropic-ai/sdk, Resend, Upstash Redis+Ratelimit, @react-pdf/renderer, framer-motion, BlockNote (админ-редактор). Node 24.x, Husky.
- Деплой: Vercel, git push в main -> auto-deploy. Ручной vercel --prod только если auto-deploy сломан (free tier 100/сутки).
- DNS/почта: Cloudflare (DNS + Email Routing -> Brevo -> Gmail), vibecraft.kz.
- Блог: генерит vela-marketing-bot -> PR в borisk85/vibecraft, правка в /admin/blog/[pr], контент в lib/blog-posts.ts.
- Позиционирование: не «дешевле» — скорость + исход.
- Source of truth по ценам/услугам: components/sections/Services.tsx и Pricing.tsx.

## СЛЕДУЮЩИЙ ШАГ ПОСЛЕ ПЕРЕРЫВА
- Закрыть миграцию, затем п.1 очереди (услуги GEO/Speed Boost) когда подтвердишь цены.
