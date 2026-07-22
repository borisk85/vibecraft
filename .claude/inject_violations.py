"""UserPromptSubmit-хук — пара к stop_soft.py.

Stop-хуки больше не блокируют ход (это плодило дубли ответов в чате). Их вердикт
складывается в pending_violations.json, а здесь подмешивается в начало следующего
хода: правило доходит до модели, но второй ответ на тот же вопрос не появляется.

Файл читается один раз и сразу чистится — нарушение не тянется вечно.
Fail-open: нет файла/сбой — ничего не подмешиваем.
"""
import json
import sys
from pathlib import Path

PENDING = Path(__file__).parent / "pending_violations.json"


def main():
    try:
        if not PENDING.exists():
            sys.exit(0)
        items = json.loads(PENDING.read_text(encoding="utf-8") or "[]")
        try:
            PENDING.unlink()
        except Exception:
            pass
        items = [str(i).strip() for i in items if str(i).strip()]
        if not items:
            sys.exit(0)
        lines = "\n".join(f"- {i}" for i in items)
        context = (
            "## Нарушения в ТВОЕМ ПРОШЛОМ ответе (проверки отработали после его показа):\n"
            f"{lines}\n"
            "НЕ переписывай прошлый ответ и не извиняйся за него — Boris это уже прочитал. "
            "Просто не повтори то же самое в текущем ответе."
        )
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context,
            }
        }))
    except Exception:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
