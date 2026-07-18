---
description: Завершение рабочей сессии vibecraft — чистка мусора + запись прогресса в memory
---

# Завершение сессии vibecraft

Выполнить в указанном порядке:

## 1. Очистка мусора в папке проекта

Удалить debug-артефакты которые накопились за сессию:

```bash
cd "C:/Claude Code/vibecraft"
rm -f *.png *.jpg                              # debug-скриншоты в корне
rm -f .playwright-mcp/*.yml                    # Playwright snapshots
rm -f *.html_preview *_preview.html            # email/template превью
rm -f lh-*.json                                # Lighthouse артефакты
find . -maxdepth 2 -name "*.tmp" -delete       # временные файлы
find . -maxdepth 2 -name "*.bak" -delete       # бэкапы редакторов
```

Затем `ls -la` в корне и подтвердить что критичные файлы (CLAUDE.md, README.md, package.json, app/, components/, lib/) на месте.

**НЕ удалять:**
- `docs/` — backlog и документация
- `process-desktop.png`, `solution-lines.png` — рабочие изображения для лендинга
- `.env.local`, `.env.example` — конфиги
- Любой `.md` в корне (CLAUDE.md, AGENTS.md, README.md)

## 2. Обновление памяти и прогресса

Создать файл сессии в `C:/Users/bkoma/.claude/projects/c--Claude-Code-vibecraft/memory/project_session_YYYY_MM_DD.md`:

```markdown
---
name: project_session_YYYY_MM_DD
description: Сессия DD.MM — короткое описание главного
type: project
---

# Сессия DD.MM.YYYY — итоги

## Что сделано
- [конкретный факт 1]
- [git commit hash + краткое описание]

## Новые правила/файлы (если были)
- ...

## Уроки сессии (если были корневые)
- ...
```

Добавить ссылку в `MEMORY.md` в секцию `## Sessions` одной строкой.

## 3. Проверка состояния git

```bash
cd "C:/Claude Code/vibecraft" && git status && git log --oneline -10
```

Показать что в working tree и какие коммиты ушли за сессию. **Самостоятельно НЕ коммитить** — Boris сам решает.

## 4. Финальный отчет

Короткий отчет в чат:
- Что удалено (количество файлов + типы)
- Куда записан прогресс
- Состояние git (clean / N changes pending)
- Сколько коммитов запушено за сессию

Без воды. Один абзац.
