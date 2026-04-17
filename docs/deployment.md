# Деплой vibecraft.kz на Vercel

Пошаговая инструкция первого деплоя. Проходится один раз. Последующие деплои идут автоматически при push в main.

## 0. Чек перед деплоем

Убедитесь, что локально:

```bash
git status       # чисто
git branch       # текущая ветка main
npm run build    # проходит без ошибок
```

## 1. GitHub репозиторий

1. https://github.com/new → имя `vibecraft` → **Private** (кодовая база не публичная) → без README, без .gitignore, без лицензии (всё уже локально).
2. После создания GitHub покажет две команды push-блока. Выполните локально:
   ```bash
   git remote add origin git@github.com:<YOUR_USERNAME>/vibecraft.git
   git push -u origin main
   ```
3. Откройте репозиторий на github.com — должны быть все коммиты (`feat(content)`, `feat(animations)`, `feat(integrations)`, `feat(seo)`, `chore(deploy-prep)`).

## 2. Создание проекта на Vercel

1. https://vercel.com → Add New → Project → Import Git Repository → выберите `vibecraft`.
2. **Framework Preset:** Next.js (должен определиться автоматически).
3. **Root Directory:** `./` (оставить как есть).
4. **Build Command:** `next build` (по умолчанию).
5. **Output Directory:** `.next` (по умолчанию).
6. **Node.js Version:** 20.x (LTS, совместим с Next 16).
7. **Environment Variables** — добавить до первого деплоя:

| Переменная | Значение | Область |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | токен бота Vibecraft Leads | Production, Preview, Development |
| `TELEGRAM_CHAT_ID` | `661638470` (ваш личный chat_id) | Production, Preview, Development |
| `NEXT_PUBLIC_YM_ID` | пустое (заполнить после создания счётчика Яндекс.Метрики) | Production |
| `NEXT_PUBLIC_GA_ID` | пустое (заполнить после создания ресурса GA4) | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://vibecraft.kz` | Production |

На preview-деплоях `NEXT_PUBLIC_SITE_URL` можно оставить пустым — код fallback на `https://vibecraft.kz`.

8. Deploy. Первый билд занимает ~30–60 секунд. После успеха получите URL вида `vibecraft-xxx.vercel.app`.

## 3. Подключение домена vibecraft.kz

1. Vercel Dashboard → Project → Settings → Domains → Add.
2. Добавьте сначала `vibecraft.kz`, затем `www.vibecraft.kz`. Vercel предложит:
   - `vibecraft.kz` → основной (apex)
   - `www.vibecraft.kz` → редирект на apex (рекомендуется)
3. Vercel покажет нужные DNS-записи. Зайдите в панель ps.kz → Домены → vibecraft.kz → DNS-записи и пропишите:

| Тип | Имя | Значение |
|---|---|---|
| A | `@` (apex) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

4. TTL оставьте по умолчанию (обычно 3600).
5. SSL-сертификат Let's Encrypt Vercel подтянет автоматически в течение 5 минут после распространения DNS. В Vercel Dashboard у домена появится зелёная галочка.
6. Распространение DNS может занять от 10 минут до 2 часов. Проверить можно командой:
   ```bash
   nslookup vibecraft.kz
   ```
   Должен вернуть `76.76.21.21`.

## 4. Post-deploy проверки

На опубликованном URL (https://vibecraft.kz) пройтись по чеклисту:

### 4.1. Форма заявки
- Прокрутить до блока «Опишите задачу».
- Отправить тестовую заявку.
- В Telegram (@vibecraft_leads_bot) должно прийти сообщение с жирными заголовками полей. Это подтверждает, что env-переменные `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` подхватились.

### 4.2. Lighthouse
Открыть DevTools → Lighthouse → Analyze page load. Ожидаемые цифры на публичном URL (Vercel + Brotli + HTTP/2):

| Метрика | Desktop | Mobile |
|---|---|---|
| Performance | 98+ | 88+ |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Если mobile Performance < 80 — проверить, не упал ли edge runtime `/opengraph-image` (лог в Vercel Dashboard → Functions).

### 4.3. Валидация Schema.org
- https://search.google.com/test/rich-results → ввести `https://vibecraft.kz`.
- Должно распознать: Organization, Service (6 штук), FAQPage.
- Если ругается на Offer.price без валюты — проверьте, что `priceCurrency: KZT` на месте (он есть в коде, ошибок быть не должно).

### 4.4. OG-превью
- https://www.opengraph.xyz/url/https%3A%2F%2Fvibecraft.kz — проверка Facebook / LinkedIn / Telegram превью.
- https://cards-dev.twitter.com/validator — проверка Twitter Card (`summary_large_image`).
- Превью должно показывать чёрный фон, gradient-круг, заголовок «Vibecraft», субтитр «AI-разработка · Telegram-боты · MVP».
- Если превью пустое — открыть `https://vibecraft.kz/opengraph-image` напрямую, должен вернуться PNG 1200×630.

### 4.5. Robots и Sitemap
- https://vibecraft.kz/robots.txt — должен быть доступен, содержать `Sitemap:` строку.
- https://vibecraft.kz/sitemap.xml — список URL (`/`, `/blog`).

### 4.6. Аналитика (после заполнения env)
- Яндекс.Метрика: Settings → Environment Variables → `NEXT_PUBLIC_YM_ID` = цифровой ID счётчика. Redeploy. В DevTools → Network после загрузки страницы должен появиться запрос к `mc.yandex.ru/metrika/tag.js`.
- GA4: то же с `NEXT_PUBLIC_GA_ID`. В Network — запрос к `googletagmanager.com/gtag/js`.

## 5. Автоматический redeploy

После первой настройки каждый `git push` в ветку `main` запускает production деплой автоматически. Любая другая ветка → preview-деплой на отдельном `*.vercel.app` URL.

## 6. Если что-то пошло не так

- **Build fails**: открыть Vercel Dashboard → Deployments → failed deployment → Logs. Скопировать ошибку и вернуться к коду.
- **Env-переменные не подтянулись**: после изменения env нужен redeploy (Settings → Environment Variables → Save → вернуться в Deployments → кликнуть Redeploy).
- **Домен не указывает**: ещё не распространился DNS (до 2 часов) или запись в ps.kz некорректная. Проверить через `nslookup`.
- **Telegram API ругается 400/401**: токен или chat_id в Vercel env отличаются от `.env.local`. Пересинхронизировать.
