---
name: build-site
description: Строит нишевый сайт-инструмент после покупки домена.
---

# /build-site

Строит нишевый сайт-инструмент после покупки домена.

## Usage
`/build-site [keyword] [domain]`

## What it does

1. Проверить наличие `C:/Claude Code/niche-tools/sites/[slug]/COMPETITOR_ANALYSIS.md`:
   - Если файл **не существует** — СТОП. Запустить `/analyze-competitors [keyword]` сначала. Без анализа стройку не начинать.
   - Если файл **существует** — прочитать, найти строки `Формат:` (что строим — калькулятор/визуализатор/тренажер/генератор/гибрид) и `AI_VERDICT: YES / NO`.
   - **Строить ИМЕННО выбранный формат, а не дефолтный калькулятор.** Структура страницы и дизайн-секция ниже описаны на примере калькулятора — адаптировать под формат: у визуализатора центр = интерактивный график/схема, у тренажера = повторяющийся цикл попытка→результат, у генератора = кнопка генерации + выдача + копирование, у конструктора = drag/выбор элементов. Главный элемент первого экрана = ядро выбранного формата (не обязательно число).

2. Read `C:/Claude Code/niche-tools/CLAUDE.md` — стек и правила.

3. Определить архитектуру на основе AI_VERDICT:
   - `AI_VERDICT: NO` → чистый JS, никаких edge functions
   - `AI_VERDICT: YES` → добавить Haiku edge function для указанного use case

4. Строить по стандарту 2026 из секции "Дизайн" ниже — **НИКОГДА не спрашивать Boris про дизайн**. Цвет акцента — брать из секции "Цвета по тематике". Финансовая ниша → синий #2563EB. Сад/строительство → зеленый #16A34A. Самостоятельно.

5. Построить сайт — обязательные файлы:
   - `index.html` — главная страница с инструментом
   - `privacy-policy.html` — Privacy Policy (обязательно для рекламных сетей)
   - `terms.html` — Terms of Service
   - `sitemap.xml`, `robots.txt`, `vercel.json`
   - Edge function только если нужен Haiku

   Содержимое index.html:
   - Tailwind — **статичный prebuilt CSS** (см. обязательный блок «Tailwind CSS» ниже; НИКОГДА не runtime CDN)
   - Instant result (oninput)
   - Mobile-first
   - Секция с объяснением (SEO + доверие)
   - FAQ блок минимум 5 вопросов (long-tail SEO)
   - Footer с ссылками на Privacy Policy и Terms
   - Adsterra блоки в 3 местах — ОДИНАКОВО на всех сайтах (не разъезжаться): **728×90** на десктопе сразу под калькулятором; **300×250** в середине контента ПЕРЕД секцией FAQ (НЕ сразу под результатом — чтобы не стакать с 728); **нативный баннер** между FAQ и footer.
     **ОБЯЗАТЕЛЬНЫЙ шаблон — srcdoc/iframe НЕ использовать** (Adsterra внутри srcdoc не загружается):
     ```html
     <!-- 300x250 (min-height резервирует место — анти-CLS, обязательно) -->
     <div id="ad-300" class="flex justify-center my-6" style="min-height:250px;align-items:center">
       <script>(function(){var atOptions={"key":"КЛЮЧ","format":"iframe","height":250,"width":300,"params":{}};var s=document.createElement("script");s.src="//www.highperformanceformat.com/КЛЮЧ/invoke.js";document.getElementById("ad-300").appendChild(s);})();</script>
     </div>
     <!-- 728x90 desktop (min-height анти-CLS) -->
     <div id="ad-728" class="hidden sm:flex justify-center my-6" style="min-height:90px;align-items:center">
       <script>(function(){var atOptions={"key":"КЛЮЧ","format":"iframe","height":90,"width":728,"params":{}};var s=document.createElement("script");s.src="//www.highperformanceformat.com/КЛЮЧ/invoke.js";document.getElementById("ad-728").appendChild(s);})();</script>
     </div>
     <!-- Native banner (обернут в min-height — анти-CLS) -->
     <div style="min-height:250px"><script async data-cfasync="false" src="//НАТИВНЫЙ_URL/invoke.js"></script><div id="container-КЛЮЧ"></div></div>
     ```
     Ключи брать из `C:/Claude Code/niche-tools/ADSTERRA_KEYS.md` (или создать placeholder если нет).
   - **Аффилиат-блок при стройке НЕ ставить.** Все сети для КЗ закрыты (июнь 2026), а заглушки-ссылки без трекинга не зарабатывают и зря занимают место (урок land loan, блок удален 12.06.2026).
     Аффилиат добавляется ПОЗЖЕ отдельным шагом: сайт набрал трафик → `/find-affiliates` (прямые программы) или переподача в сети (сентябрь 2026+) → апрув программы → ТОГДА вставить блок с реальными ссылками.

   Privacy Policy должна включать:
   - Использование cookies и рекламы (Google AdSense / Adsterra compatible)
   - Сбор данных (нет персональных данных)
   - Контакт email

6. Если нужен Haiku:
   - Vercel Edge Function в `/api/[function-name].js`
   - Кеш через Vercel KV или простой in-memory cache
   - Rate limit: 10 запросов/час на IP (бесплатно, без базы)

7. Создать `sitemap.xml`, `robots.txt`, `vercel.json`

8. Lighthouse требования (обязательно):
   - LCP < 2.5 сек (нет тяжелых изображений, нет внешних шрифтов без preload)
   - **Tailwind — статичный prebuilt CSS, НЕ runtime CDN** (см. блок «Tailwind CSS» ниже).
     Runtime (`cdn.tailwindcss.com`, `@tailwindcss/browser`) убивает LCP и дает FOUC; `tailwindcss@3/dist/*` отдает 404 (v3 не публикует prebuilt). Оба варианта ломали сайты — НЕ использовать.
   - **CLS < 0.1** (см. блок «Zero-CLS» ниже) — реклама/шрифт не должны двигать контент.
   - Никаких blocking scripts в <head>
   - Все img с width/height атрибутами; inline SVG-логотип — тоже с `width`/`height`
   - Цель: Performance 90+, SEO 100, Accessibility 90+, CLS < 0.1

9. UI self-review через Playwright (обязательно перед деплоем):
   - Запустить `mcp__playwright__browser_navigate` на localhost или file:// path
   - Сделать скриншот через `mcp__playwright__browser_take_screenshot`
   - Проверить по чеклисту:
     - [ ] Главный результат (число) — минимум `text-5xl`, акцентный цвет, сразу виден
     - [ ] Вторичные метрики (если есть) — каждая в отдельной карточке `bg-white rounded-lg`, `text-xl font-bold`
     - [ ] Зоны ввода — отличаются от фона (`bg-gray-50` или border)
     - [ ] Инпуты минимум `h-11`, хорошо читаемые
     - [ ] На мобайле (375px) — результат виден без скролла
     - [ ] **CSS реально применился** (не голый HTML): через `browser_evaluate` проверить `getComputedStyle(section).backgroundColor === 'rgb(255, 255, 255)'` и что лого `width === 32px` (не растянут). Если стили не применились — `styles.css` не собран/не подключен.
     - [ ] **Рекламные контейнеры держат высоту пустыми** — `#ad-300` и нативный имеют `min-height` ≥ их зоны (анти-CLS), проверить `getBoundingClientRect().height`.
     - [ ] **Шрифт не блокирует рендер** — `document.querySelector('link[href*="fonts.googleapis"]').media === 'print'` должно быть `true`. Если `all`/пусто — шрифт render-blocking, применить head-шаблон (−1.5-1.8 сек LCP).
   - Если что-то не проходит — исправить HTML, пересобрать CSS, пересмотреть скриншот
   - Только после прохождения всех пунктов → деплой

10. **Задеплоить самому** (`npx vercel --prod --yes` из папки сайта, привязать домен через `vercel domains add [domain]` — НЕ `alias set`, тот дает 401 SSO). Проверить что сайт отвечает 200.

11. **АВТО-ЦЕПОЧКА — без пауз и без вопросов Boris.** Сразу после успешного деплоя НЕМЕДЛЕННО вызвать через Skill tool `/check-site [domain]`. Не спрашивать «запускать ли проверку» — Boris хочет, чтобы цепочка `build-site → check-site → launch-site` шла автоматически. check-site сам в конце вызовет launch-site. Только если деплой не удался — остановиться и сказать Boris что сломалось.

## Дизайн — стандарт 2026 (применять без референса от Boris)

**Что работает у лидеров (OmniCalc 7M трафика, InchCalc, TDEECalc):**
- Белый фон `#FFFFFF` или очень светло-серый `#F9FAFB`
- Один акцентный цвет под тематику (зеленый для природы/сада, синий для финансов/tech)
- Скругленные углы везде: `rounded-xl` на карточках, `rounded-lg` на инпутах
- Тень карточки: `shadow-md` — дает глубину без перегруза
- Большие инпуты: минимум `h-12`, padding `px-4`, шрифт `text-lg`
- Результат выделен: `text-5xl font-extrabold` в акцентном цвете — доминирует на странице
- Вторичные метрики — каждая в `bg-white rounded-lg py-3 px-2`, число `text-xl font-extrabold`, лейбл `text-xs text-gray-500`
- Instant calculation — результат меняется при вводе (oninput), без Submit
- Слайдеры где уместно (Range input) — лучше UX на мобайле
- Никакой навигации сверху — только лого/название + калькулятор + объяснение + FAQ

**Структура страницы (сверху вниз):**
1. H1 + одна строка описания что считает
2. Карточка калькулятора (инпуты + результат)
3. Как пользоваться (2-3 предложения)
4. Формула с объяснением (SEO + доверие)
5. FAQ блок — минимум 5 вопросов
6. Footer — только название и год

**Цвета по тематике:**
- Сад/строительство/природа → зеленый `#16A34A`
- Финансы/карьера → синий `#2563EB`
- Здоровье/фитнес → фиолетовый `#7C3AED`
- Технологии/инструменты → серо-синий `#475569`

**Шрифт:** Inter (Google Fonts) — стандарт де-факто для tool-сайтов
**Иконки:** Heroicons inline SVG — не подключать иконочные библиотеки

**Mobile-first обязательно:**
- Инпуты минимум 48px высоты (touch targets)
- Карточка калькулятора на всю ширину мобайла
- Результат виден без скролла

**НЕ использовать:**
- Градиенты на фоне
- Анимации (замедляют LCP)
- Google Fonts через @import (замедляет, лучше preconnect + link)
- Темный фон (снижает RPM — рекламодатели хуже конвертят)

---

## Tailwind CSS — статичный prebuilt (ОБЯЗАТЕЛЬНО, делать в /build-site)

Runtime Tailwind CDN убивает PageSpeed и ломает UI. ВСЕГДА собирать статичный CSS один раз:

1. `tailwind.config.js`: `module.exports = { content: ['./index.html'], theme:{extend:{}}, plugins:[] };`
   (content включает index.html — сканирует и HTML, и классы внутри `<script>`, включая динамически генерируемые строки классов в JS)
2. `src-input.css`: три строки — `@tailwind base;` `@tailwind components;` `@tailwind utilities;`
3. Собрать: `npx tailwindcss@3 -i src-input.css -o styles.css --minify` (из папки сайта; ~5-15KB)
4. В `<head>`: `<link rel="stylesheet" href="/styles.css">` — НИКАКОГО `<script src=...tailwind...>`
5. `.gitignore` в папке сайта: `node_modules/`
6. **После ЛЮБОЙ правки HTML (новые классы) — пересобрать той же командой ШАГ 3, иначе новые классы не появятся в CSS.** Deploy без пересборки = сломанные стили.

Проверка перед деплоем: `curl .../styles.css` → 200; в HTML нет `cdn.tailwindcss.com` и `@tailwindcss/browser`.

## ОБЯЗАТЕЛЬНЫЙ шаблон подключения CSS+шрифта в `<head>` (копировать дословно, НЕ брать со старых сайтов)

⚠️ Порядок и атрибуты критичны. `styles.css` блокирующий (нужен для первого экрана), шрифт — НЕ блокирующий (иначе PageSpeed «render-blocking», −1.5-1.8 сек к LCP). НЕ копировать `<head>` со старого сайта вслепую — на ранних сайтах (land loan) шрифт стоял блокирующим, это ошибка:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=optional" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=optional"></noscript>
```

**Проверка в Playwright-review (шаг 9):** `document.querySelector('link[href*="fonts.googleapis"]').media === 'print'` → должно быть `true` (значит шрифт не блокирует рендер). Если шрифт без `media="print"` — render-blocking, чинить до деплоя.

## Zero-CLS — резервировать высоту (ОБЯЗАТЕЛЬНО, CLS < 0.1)

Контент не должен прыгать при загрузке рекламы/шрифта:

- **Каждый рекламный контейнер — `min-height` под размер зоны СРАЗУ при сборке**, даже если ключей Adsterra еще нет (заложить пустые контейнеры): 300×250 → `min-height:250px`; 728×90 → `min-height:90px`; нативный → `min-height:250px` (прикинуть по факту). Контейнер: `style="min-height:250px;display:flex;align-items:center;justify-content:center;margin:1.5rem 0"`.
- **Шрифт: `display=optional`** в Google Fonts URL (не `swap` — swap дает сдвиг при подмене). Грузить не-блокирующе через `media="print" onload="this.media='all'"` + `<noscript>` фолбэк — см. обязательный head-шаблон выше. Блокирующий шрифт = −1.5-1.8 сек к LCP (PageSpeed render-blocking).
- **Логотип и любые img — явные `width`/`height`** атрибуты (даже inline SVG).
- 728×90 на мобиле скрыт — но `min-height` все равно заложить для desktop CLS.

## Accessibility (90+, обязательно)

Главный провал — поля формы без связанного label (дает A11y 76-85). Правила:
- **Каждый `input`/`select`/`textarea` связать с label**: либо `<label for="id">` + `id` на поле, либо `aria-label="..."` на самом поле. Видимый текст-метка рядом НЕ считается связанным без `for`.
- **Динамически генерируемые в JS поля** (зоны, клонируемые строки) — `aria-label` прямо в template literal (там `<label>` без `for` не помогает).
- **Контраст текста ≥ AA**: не светлее `text-gray-500` (#6b7280) на белом/светлом фоне. `text-gray-400` не проходит — не использовать для читаемого текста.
- `<html lang="en">`, viewport без `user-scalable=no`, заголовки без пропуска уровней (h1→h2, не h1→h3).
- Проверка в Playwright-review: `[...document.querySelectorAll('input,select,textarea')]` — у каждого должен быть label[for], aria-label или обертка `<label>`.
