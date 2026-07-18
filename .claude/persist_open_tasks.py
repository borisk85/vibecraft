"""Stop-хук — авто-сохраняет ОТКРЫТЫЕ задачи (pending/in_progress) из последнего
TodoWrite в .claude/open_tasks.json, чтобы они не терялись между ходами и сессиями.

Класс ошибки (18.07): задачу «унифицировать меню» дали много сессий назад, она выпала
из очереди (TodoWrite живет только в рамках сессии) и НЕ была сделана вообще. Корень —
нет переноса открытых задач за пределы сессии. Пара persist_open_tasks (Stop, сохраняет)
+ inject_open_tasks (UserPromptSubmit, всплывает) закрывает этот корень без ручного
беклога: я вижу незакрытое в начале КАЖДОГО хода.

Fail-open: любой сбой — просто выходим, ничего не блокируем.
"""
import json
import sys
from pathlib import Path

STATE = Path(__file__).parent / "open_tasks.json"


def _last_todos(objs):
    for o in reversed(objs):
        if not isinstance(o, dict) or o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") == "TodoWrite"):
                return (b.get("input", {}) or {}).get("todos", [])
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    try:
        objs = []
        for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                objs.append(json.loads(line))
            except Exception:
                pass
        todos = _last_todos(objs)
        if todos is None:
            sys.exit(0)  # очереди в этой сессии не было — не трогаем прошлое состояние
        open_items = [
            {"content": t.get("content", ""), "status": t.get("status", "")}
            for t in todos
            if isinstance(t, dict) and t.get("status") in ("pending", "in_progress")
        ]
        STATE.write_text(
            json.dumps(open_items, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
