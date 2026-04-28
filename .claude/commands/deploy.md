---
description: Деплой vibecraft (git push → Vercel auto-deploy) или ручной vercel --prod
---

# Деплой vibecraft

## Стандартный путь — git push (auto-deploy)

```bash
cd "C:/Claude Code/vibecraft"
git status                    # проверить что в коммите
git add <конкретные файлы>    # НЕ git add -A
git commit -m "..."           # с понятным сообщением
git push                      # триггерит Vercel auto-deploy
```

Vercel подхватит push с GitHub и задеплоит за 1-2 минуты.

## Когда использовать ручной `vercel --prod`

Только если:
- GitHub auto-deploy сломан (Vercel dashboard показывает ошибку)
- Boris явно попросил `vercel --prod`

```bash
cd "C:/Claude Code/vibecraft"
npx vercel --prod
```

**КРИТИЧНО:** не делать `vercel --prod` после каждого `git push` — Vercel free tier дает 100 деплоев/сутки. Push уже триггерит auto-deploy, ручной `vercel --prod` после = двойной расход квоты.

## Проверка после деплоя

- Сайт: https://vibecraft.kz
- Калькулятор: https://vibecraft.kz/calculator
- Блог: https://vibecraft.kz/blog
- Vercel dashboard: https://vercel.com/borisk85/vibecraft

## Типичные проблемы

| Симптом | Что делать |
|---------|-----------|
| Vercel не подхватил push | Проверить https://vercel.com/borisk85/vibecraft → Deployments |
| Build ошибка | Vercel dashboard → последний деплой → логи |
| Сайт показывает старую версию | Подождать ~1-2 мин, CDN кеш догонит |

**НЕ предлагать Boris** Ctrl+Shift+R / hard refresh / browser cache — диагностировать реальную причину (деплой еще в процессе, ошибка билда, и т.д.).
