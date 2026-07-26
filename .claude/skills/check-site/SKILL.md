---
name: check-site
description: Финальный технический аудит после деплоя. Запускать после каждого `/build-site` + деплоя.
---

# /check-site

Финальный технический аудит после деплоя. Запускать после каждого `/build-site` + деплоя.

## Usage
`/check-site [domain]`
Пример: `/check-site howmuchtopsoil.com`

## What it does

### 1. Lighthouse через PageSpeed Insights API

```
WebFetch: https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://[domain]&strategy=mobile
```

Извлечь и показать:
- Performance score (цель: 90+)
- SEO score (цель: 100)
- Accessibility score (цель: 90+)
- Best Practices (цель: 90+)
- LCP (цель: < 2.5 сек)

Если Performance < 90 или SEO < 100 → выдать конкретные проблемы из `audits`.

### 2. Технические файлы

```
WebFetch: https://[domain]/robots.txt → проверить Allow: / и Sitemap: строку
WebFetch: https://[domain]/sitemap.xml → проверить что есть хотя бы одна <url>
WebFetch: https://[domain]/privacy → HTTP 200 или нет
WebFetch: https://[domain]/terms → HTTP 200 или нет
```

### 3. Meta-теги и Schema

WebFetch главной страницы, проверить наличие:
- `<title>` — есть и не пустой
- `<meta name="description">` — есть и не пустой
- `<link rel="canonical">` — есть
- `<meta property="og:title">` — есть
- `application/ld+json` — есть хотя бы один блок Schema

### 4. Рекламный код + render-blocking шрифт

Grep/WebFetch HTML страницы на наличие:
- Adsterra invoke.js — хотя бы один вызов
- Native banner container div
- **Шрифт НЕ блокирует рендер** (не завязывать на PageSpeed — он может дать 429): `curl -s https://[domain]/ | grep 'fonts.googleapis'` → строка ДОЛЖНА содержать `media="print"`. Если шрифт без `media="print"` (блокирующий) → автофикс (раздел 6).
- **Нет runtime Tailwind CDN** на главной И на /privacy, /terms: `grep -E 'cdn.tailwindcss.com|@tailwindcss/browser'` → пусто.

### 5. UI Playwright screenshot

```
mcp__playwright__browser_navigate → https://[domain]
mcp__playwright__browser_take_screenshot (fullPage: true)
```

Проверить по чеклисту:
- [ ] Главный результат виден и крупный (≥ text-4xl)
- [ ] Нет явных пустых белых прямоугольников кроме рекламных плейсхолдеров
- [ ] Footer с Privacy/Terms ссылками виден
- [ ] Нет сломанной верстки

### 6. Автофикс (без вопросов)

Если найдены проблемы — **фиксить сразу в index.html, деплоить, прогонять проверку повторно:**

- Tailwind browser CDN (`@tailwindcss/browser`) → заменить на `tailwindcss@3/dist/tailwind.min.css` (CSS link, не JS)
- Google Fonts блокирует рендер → добавить `media="print" onload="this.media='all'"`
- Inputs без label → добавить `aria-label` атрибут
- Select без label → добавить `aria-label`

После фикса: `git commit && npx vercel --prod` → прогнать Lighthouse повторно.

### 7. Отчет

```
=== SITE CHECK: [domain] ===
Дата: [дата]

LIGHTHOUSE (mobile):
  Performance:   [X]/100  [✅ / ⚠️ / ❌]
  SEO:           [X]/100  [✅ / ⚠️ / ❌]
  Accessibility: [X]/100  [✅ / ⚠️ / ❌]
  Best Practices:[X]/100  [✅ / ⚠️ / ❌]
  LCP:           [X.X] сек [✅ / ❌]

ФАЙЛЫ:
  robots.txt:    [✅ ОК / ❌ нет]
  sitemap.xml:   [✅ ОК / ❌ нет]
  Privacy:       [✅ 200 / ❌ нет]
  Terms:         [✅ 200 / ❌ нет]

SEO:
  Title:         [✅ / ❌]
  Description:   [✅ / ❌]
  Canonical:     [✅ / ❌]
  Schema:        [✅ / ❌]

РЕКЛАМА:
  Adsterra:      [✅ найдено / ❌ нет кода]

UI: [✅ норм / ⚠️ проблема: опиши]

ИТОГ: ✅ ГОТОВ / ⚠️ ТРЕБУЕТ ФИКСОВ
Фиксы: [список если есть]
```

Если есть фиксы — исправить сразу, задеплоить, прогнать проверку повторно.

### 8. АВТО-ЦЕПОЧКА — вызвать launch-site

После отчета, **если ИТОГ = ✅ ГОТОВ (или ⚠️ с некритичными замечаниями) — НЕМЕДЛЕННО вызвать через Skill tool `/launch-site [name] [url]`**, без паузы и без вопросов Boris. Это завершает авто-флоу `build-site → check-site → launch-site`. Только если ИТОГ = ❌ (критичные фиксы не починить) — остановиться и сказать Boris.

## Notes
- PageSpeed API бесплатный без ключа, но имеет дневную квоту (Queries per day) на общий проект — может вернуть 429. Если исчерпана: отметить «Lighthouse не получен (квота API)», остальные проверки все равно прогнать (CLS/реклама уже мерены вживую в build-site). Не блокировать флоу из-за 429.
- Запускать после каждого нового сайта и после крупных правок
- Playwright screenshot временный — удалять после проверки (в репо не коммитить)
