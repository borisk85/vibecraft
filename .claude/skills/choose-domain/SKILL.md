---
name: choose-domain
description: Подбирает и проверяет домены для нишевого сайта. НЕ выдумывает из головы: реальная проверка доступности через API регистратора.
---

# /choose-domain

Подбирает и проверяет домены для нишевого сайта. НЕ выдумывает из головы — реальная проверка доступности.

## Usage
`/choose-domain [keyword]`

## What it does

1. Генерировать 15 вариантов доменных имен по принципам:
   - Содержит главный keyword или его часть
   - Короткий (до 20 символов без .com)
   - Легко произносится и запоминается
   - Без дефисов если возможно
   - Форматы: [keyword].com, [keyword]calc.com, [keyword]tool.com, best[keyword].com, how-much-[keyword].com, [keyword]calculator.com

2. Проверить доступность каждого через WebFetch:
   - `https://api.porkbun.com/api/json/v3/domain/check` (бесплатный API Porkbun без ключа)
   - ИЛИ `https://www.namecheap.com/domains/registration/results/?domain=[name]` — парсинг страницы
   - Отметить: ✅ свободен / ❌ занят

3. Отфильтровать занятые, отсортировать свободные по качеству:
   - Приоритет 1: короткое + содержит точный keyword
   - Приоритет 2: содержит keyword + суффикс (calc, tool, io)
   - Приоритет 3: описательное без keyword в названии

4. Вывести топ-5 свободных с ценой:

```
=== ДОМЕНЫ для [keyword] ===

✅ [domain].com — $11/год (Porkbun) — РЕКОМЕНДУЮ
   Почему: короткий, точный keyword, .com

✅ [domain2].com — $11/год
   Почему: ...

✅ [domain3].com — $9/год (Spaceship)
   Почему: ...

✅ [domain4].com — $11/год
   Почему: ...

✅ [domain5].com — $11/год
   Почему: ...

Купить на: porkbun.com ($11/год) или spaceship.com ($9/год)
После покупки: скинь домен → запускаю /build-site
```

## Notes
- Проверять именно .com — не .io, не .net, не .co (если .com занят — сказать)
- Не предлагать домены с числами или двойными дефисами
- Если Porkbun API не отвечает → WebSearch "[domain] availability check"
