"""PreToolUse hook (TodoWrite) — ЗАПРЕТ прыгать с задачи на задачу.

Класс ошибки (2026-07-17, Boris в ярости весь день): я самовольно бросаю текущую
in_progress задачу недоделанной и переключаюсь на другую (реагирую на каждый новый
ввод немедленно вместо очереди). CLAUDE.md прямо: «Один шаг за раз… доделать текущую
до конца, потом взять следующую», «Не переключаться между задачами». Разрешения
прыгать НЕТ нигде.

Механизм: сравниваю ПРЕДЫДУЩИЙ TodoWrite с новым. Если задача, что была in_progress,
в новом списке НЕ помечена completed (осталась висеть/отменена), А активной сделана
ДРУГАЯ задача — это прыжок. Блок. Разрешаем только если Boris в недавних сообщениях
явно велел бросить/переключиться (брось, сейчас, срочно, оставь, переключись).
"""
import json
import re
import sys
from pathlib import Path

SWITCH_OK_RE = re.compile(
    r"(\bброс\w*|\bсейчас\b|срочн\w*|\bоставь\b|переключ\w*|отложи\w*|"
    r"сначала\s+это|это\s+вперед|важнее|приорит\w*|стоп\s+делай)",
    re.IGNORECASE | re.UNICODE)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _is_tool_result(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


def _prev_todos(msgs):
    """todos из ПРЕДЫДУЩЕГО (последнего в транскрипте) вызова TodoWrite."""
    for m in reversed(msgs):
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") == "TodoWrite"):
                return (b.get("input", {}) or {}).get("todos", [])
    return None


def _recent_boris(msgs, n=4):
    out = []
    for m in reversed(msgs):
        if m.get("type") != "user" or m.get("isMeta") or _is_tool_result(m):
            continue
        c = m.get("message", {}).get("content", "")
        text = c if isinstance(c, str) else " ".join(
            b.get("text", "") for b in c
            if isinstance(b, dict) and b.get("type") == "text")
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S).strip()
        if not text or any(mk in text for mk in SERVICE_MARKERS):
            continue
        out.append(text)
        if len(out) >= n:
            break
    return out


def _words(s):
    """Значимые слова задачи (длина >=4). Сравниваем задачи по СМЫСЛУ, а не по точному
    префиксу: переформулировка content между вызовами больше не ломает матчинг (баг
    18.07 — старый ключ по первым 28 символам ложно видел «прыжок» и блокировал всю
    очередь при малейшем переименовании задачи)."""
    return {w for w in re.findall(r"[\w]{4,}", (s or "").lower(), re.UNICODE)}


def _overlap(pw, other):
    """Доля слов pw, встретившихся в other."""
    if not pw:
        return 0.0
    return len(pw & _words(other)) / len(pw)


def _contents(todos, status=None):
    return [t.get("content", "") for t in (todos or [])
            if isinstance(t, dict) and (status is None or t.get("status") == status)]


def decide():
    try:
        # stdin ОБЯЗАТЕЛЬНО читать как utf-8: иначе на Windows кириллица в новых
        # todos декодится в cp1252-мохибейк и не совпадает с utf-8 из транскрипта —
        # хук ложно решает, что задачи разные, и блокирует любой TodoWrite (баг 17.07).
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "ignore") or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse" or data.get("tool_name") != "TodoWrite":
        return None
    new_todos = (data.get("tool_input", {}) or {}).get("todos", [])
    tp = data.get("transcript_path")
    if not tp or not Path(tp).exists():
        return None
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    prev = _prev_todos(msgs)
    if prev is None:
        return None  # первый TodoWrite — не с чем сравнивать
    prev_ip = _contents(prev, "in_progress")
    if not prev_ip:
        return None  # ничего не было в работе — не прыжок
    all_new = _contents(new_todos)  # новые задачи ЛЮБОГО статуса
    new_ip = _contents(new_todos, "in_progress")
    # «Брошена» = прежняя in_progress задача ИСЧЕЗЛА из нового списка по смыслу (нет ни
    # одной новой задачи с пересечением слов >= 0.5 в любом статусе). Переименованный
    # completed по-прежнему матчится по словам — ложного «прыжка» больше нет.
    abandoned = [pc for pc in prev_ip
                 if max([_overlap(_words(pc), nc) for nc in all_new] or [0.0]) < 0.5]
    # «Новая активная» = in_progress, которой по смыслу не было среди прежних in_progress
    newly_started = [nc for nc in new_ip
                     if max([_overlap(_words(nc), pc) for pc in prev_ip] or [0.0]) < 0.5]
    if not abandoned or not newly_started:
        return None
    if any(SWITCH_OK_RE.search(t) for t in _recent_boris(msgs)):
        return None  # Boris явно велел переключиться
    ab = "; ".join(abandoned[:2])
    ns = "; ".join(newly_started[:2])
    return (
        f"БЛОК check_no_task_jump: ты бросаешь недоделанную задачу «{ab}» и делаешь "
        f"активной другую «{ns}». Это ПРЫЖОК с задачи на задачу — CLAUDE.md запрещает "
        "(«одна задача до конца», «не переключаться между задачами»), разрешения нет. "
        "Доведи текущую до completed, ПОТОМ бери следующую по очереди. Новый ввод Boris "
        "заноси в pending, но активной делай только после закрытия текущей. Если Boris "
        "явно велел бросить — этого сигнала в его сообщениях нет."
    )


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
