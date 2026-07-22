"""PreToolUse hook на TodoWrite — блокирует ПОТЕРЮ задачи из очереди.

ВНИМАНИЕ (22.07): проверено логированием — на TodoWrite этот хук НЕ вызывается
вовсе, ни одной записи в лог не легло. Рабочая защита от потери задач живет
в check_todo_dropped_stop.py (Stop-хук). Этот файл оставлен как есть на случай,
если PreToolUse на TodoWrite заработает.

Класс ошибки (повторяется, Boris в ярости): при обновлении TodoWrite я передаю
список вручную и ЗАБЫВАЮ перенести pending/in_progress пункт — он молча исчезает.
Boris не должен глазами следить за моей очередью.

Логика: сравниваю новый список todos с предыдущим TodoWrite из транскрипта.
Каждый прошлый пункт со статусом pending/in_progress ОБЯЗАН присутствовать в новом
списке (по смысловому совпадению content) — неважно с каким статусом (можно пометить
completed/cancelled, но НЕ выкидывать). Если пункт пропал совсем — блок.
"""
import json
import re
import sys


def _sig(text: str) -> set:
    return {w for w in re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9]{4,}", (text or "").lower())}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _todos_of(obj):
    """Список todos из assistant-сообщения с tool_use TodoWrite, иначе None."""
    if obj.get("type") != "assistant":
        return None
    c = (obj.get("message", {}) or {}).get("content")
    if not isinstance(c, list):
        return None
    for b in c:
        if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "TodoWrite":
            return (b.get("input", {}) or {}).get("todos")
    return None


def decide():
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "ignore") or "{}")
    except Exception:
        return None
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None

    # последний предыдущий TodoWrite в транскрипте
    prev = None
    for line in lines:
        try:
            o = json.loads(line)
        except Exception:
            continue
        t = _todos_of(o)
        if t is not None:
            prev = t
    if not prev:
        return None  # первый TodoWrite — сравнивать не с чем

    new_sigs = [_sig(t.get("content", "")) for t in new_todos if isinstance(t, dict)]

    dropped = []
    for pt in prev:
        if not isinstance(pt, dict):
            continue
        if pt.get("status") not in ("pending", "in_progress"):
            continue  # завершённые ронять можно
        ps = _sig(pt.get("content", ""))
        if not ps:
            continue
        best = max((_jaccard(ps, ns) for ns in new_sigs), default=0.0)
        if best < 0.4:  # ни один новый пункт не похож → пункт потерян
            dropped.append(pt.get("content", "")[:70])

    if dropped:
        lst = "; ".join(dropped)
        return (
            "БЛОК check_todo_no_drop: из очереди ПРОПАЛИ незавершённые задачи "
            f"[{lst}]. Boris не должен следить за очередью глазами. Ты обязан "
            "перенести КАЖДЫЙ pending/in_progress пункт в новый список TodoWrite "
            "(можно сменить статус на completed/cancelled, но НЕ выкидывать). "
            "Верни выпавшие пункты и повтори вызов."
        )
    return None


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }))
    sys.exit(0)


if __name__ == "__main__":
    main()
