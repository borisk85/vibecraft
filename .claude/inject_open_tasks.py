"""UserPromptSubmit-хук — всплывает ОТКРЫТЫЕ задачи из .claude/open_tasks.json в начале
каждого хода, чтобы незакрытое не терялось между сессиями (пара к persist_open_tasks).

Класс ошибки (18.07): задача выпала из очереди и не сделана много сессий. Теперь при
каждом вводе Boris я вижу список незакрытого и обязан либо доделать, либо явно закрыть.

Fail-open: нет файла/сбой — просто ничего не подмешиваем.
"""
import json
import sys
from pathlib import Path

STATE = Path(__file__).parent / "open_tasks.json"


def main():
    try:
        if not STATE.exists():
            sys.exit(0)
        items = json.loads(STATE.read_text(encoding="utf-8") or "[]")
        items = [i for i in items if isinstance(i, dict) and i.get("content")]
        if not items:
            sys.exit(0)
        lines = "\n".join(
            f"- [{i.get('status', '')}] {i['content']}" for i in items)
        context = (
            "## НЕЗАКРЫТЫЕ задачи (перенесены с прошлого хода/сессии) — НЕ бросай их:\n"
            f"{lines}\n"
            "Доделай по очереди или, если Boris отменил, закрой явно через TodoWrite. "
            "Молча игнорировать = тот самый баг с потерянной задачей."
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
