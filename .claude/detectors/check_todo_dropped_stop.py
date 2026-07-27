"""Stop hook — ловит МОЛЧА ВЫКИНУТЫЕ задачи из очереди.

Класс ошибки (Boris, 22.07, в ярости): я переписываю список TodoWrite целиком
и теряю пункты — задача про удаленную базу Upstash так и пропала, Boris заметил
это глазами. Парный PreToolUse-хук check_todo_no_drop.py оказался мертвым:
на TodoWrite он не вызывается вовсе (лог-проба не создала ни одной записи),
поэтому проверку переношу сюда — Stop-хуки в этом проекте отрабатывают всегда.

Логика: по всему транскрипту собираю задачи, которые хоть раз были pending или
in_progress, и вычитаю те, что хоть раз стали completed или cancelled. Остаток
обязан присутствовать в ПОСЛЕДНЕМ TodoWrite. Чего там нет — то выкинуто молча.
"""
import json
import re
import sys
from pathlib import Path

STATE = Path(__file__).with_name(".todo_drop_rounds")
MAX_ROUNDS = 3


def _rounds() -> int:
    try:
        return int(STATE.read_text().strip() or "0")
    except Exception:
        return 0


def _set_rounds(n: int) -> None:
    try:
        STATE.write_text(str(n))
    except Exception:
        pass


def _sig(text: str) -> set:
    return {w[:6] for w in re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9]{4,}", (text or "").lower())}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _all_todo_calls(transcript_path: str):
    out = []
    p = Path(transcript_path)
    if not p.exists():
        return out
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if (
                isinstance(b, dict)
                and b.get("type") == "tool_use"
                and b.get("name") == "TodoWrite"
            ):
                todos = (b.get("input", {}) or {}).get("todos")
                if isinstance(todos, list):
                    out.append(todos)
    return out


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active") and _rounds() >= MAX_ROUNDS:
        _set_rounds(0)
        sys.exit(0)

    tp = payload.get("transcript_path")
    if not tp:
        sys.exit(0)
    calls = _all_todo_calls(tp)
    if len(calls) < 2:
        sys.exit(0)

    open_items = {}   # текст -> сигнатура, задачи в работе
    closed = []       # сигнатуры закрытых
    for todos in calls:
        for t in todos:
            if not isinstance(t, dict):
                continue
            text = (t.get("content") or "").strip()
            if not text:
                continue
            status = t.get("status")
            if status in ("pending", "in_progress"):
                open_items[text] = _sig(text)
            elif status in ("completed", "cancelled"):
                closed.append(_sig(text))

    last_sigs = [
        _sig((t.get("content") or ""))
        for t in calls[-1]
        if isinstance(t, dict)
    ]

    dropped = []
    for text, sig in open_items.items():
        if any(_jaccard(sig, c) >= 0.55 for c in closed):
            continue  # задача была честно закрыта
        if any(_jaccard(sig, l) >= 0.45 for l in last_sigs):
            continue  # задача на месте в текущем списке
        dropped.append(text[:70])

    if dropped:
        _set_rounds(_rounds() + 1)
        lst = "; ".join(dropped[:6])
        print(json.dumps({"decision": "block", "reason": (
            f"НАРУШЕНИЕ check_todo_dropped_stop: из очереди МОЛЧА выпали задачи [{lst}]. "
            "Boris их ставил, а ты переписал список и потерял. Немедленно верни каждую "
            "выпавшую задачу в TodoWrite тем же смыслом и доделай по очереди. Закрывать "
            "можно только явным completed, выкидывать — никогда."
        )}))
        sys.exit(0)

    _set_rounds(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
