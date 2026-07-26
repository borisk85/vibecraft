---
name: launch-site
description: Финальный шаг после деплоя нишевого сайта. Выводит обязательный чеклист ссылок.
---

# /launch-site

Финальный шаг после деплоя нишевого сайта. Выводит обязательный чеклист ссылок.

## Usage
`/launch-site [site-name] [url]`

## What it does

1. Update `C:/Claude Code/niche-tools/IDEAS_TRACKER.md` — переместить сайт в секцию "Building / Live" с датой и URL.

2. Вывести чеклист — ОБЯЗАТЕЛЬНО после каждого запуска:

```
=== ЧЕКЛИСТ ССЫЛОК: [site-name] ===

ДЕНЬ 1 (сегодня):
□ ProductHunt — загрузить скриншот + описание + категория "Tools"
  → 1 ссылка DR ~85 + трафик в день запуска
  → Ссылка: producthunt.com/posts/new

НЕДЕЛЯ 1 (найти треды заранее):
□ Reddit ответ 1 — найти тред где спрашивают про [тема]
□ Reddit ответ 2 — другой тред / другой сабреддит
□ Reddit ответ 3 — третий тред
  → 3 ссылки DR 70-80
  → Искать: reddit.com/search/?q=[keyword]

НЕДЕЛЯ 2:
□ Quora ответ 1 — найти вопрос по теме [тема]
□ Quora ответ 2 — второй вопрос
□ Quora ответ 3 — третий вопрос
  → 3 ссылки DR ~80
  → Искать: quora.com/search?q=[keyword]

ИТОГО: 7 ссылок DR 70-85 за 2 недели, ~3-4 часа работы.
БЕЗ ЭТОГО САЙТ НЕ РАНЖИРУЕТСЯ.
```

3. **Записать задачи в ОДИН общий файл `C:/Claude Code/niche-tools/TODO-BORIS.html` (НЕ per-site).** Boris хочет один файл на все сайты, только внешние ссылки:
   - Добавить новый блок `<div class="site [green|blue|orange|...]">` с тремя группами: ProductHunt (1) + Reddit (3, реальные сабреддиты ниши) + Quora (3, реальные вопросы). Цвет блока — под тематику.
   - **ТОЛЬКО внешние ссылки.** НЕ включать рекламу/Adsterra, аффилиат, GSC/sitemap — это не сюда (реклама идет отдельным каналом, Boris сам шлет ключи).
   - Пересобрать PDF: `& "C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --print-to-pdf-no-header --print-to-pdf="C:\Claude Code\niche-tools\TODO-BORIS.pdf" "file:///C:/Claude%20Code/niche-tools/TODO-BORIS.html"`
   - git add TODO-BORIS.html + TODO-BORIS.pdf, commit, push.
   - НЕ создавать `sites/[site]/LAUNCH_CHECKLIST.md` и НЕ создавать per-site TODO-boris.pdf — Boris не хочет кучу файлов.

## Notes
- Этот скил вызывается КАЖДЫЙ РАЗ после деплоя — не пропускать
- Ссылки адаптировать под конкретную тему сайта (подставить реальные сабреддиты и Quora-запросы)
- Через 30 дней напомнить проверить позиции в Google Search Console (устно в чате, НЕ в PDF)
