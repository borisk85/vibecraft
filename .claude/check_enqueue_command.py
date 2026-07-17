"""Stop hook — команда «в очередь» ОБЯЗАНА добавить pending-задачу, а не закрыть очередь.

Класс ошибки (2026-07-17): Boris писал «в очередь» (= занеси новую задачу в очередь
и продолжай), а я, чтобы удовлетворить check_no_stop_incomplete, пометил ВСЁ
completed и встал — сделал ОБРАТНОЕ команде. Boris в ярости: «тебе сказали задачу в
очередь, где всё?!». check_queue_on_new_task пропустил, потому что видел ЛЮБОЙ вызов
TodoWrite (даже закрывающий), а не факт, что задача реально добавлена как pending.

Правило: если в недавних сообщениях Boris есть явная команда «в очередь / поставь в
очередь / в бэклог / в todo», то в моём последнем TodoWrite ДОЛЖЕН быть хотя бы один
pending/in_progress пункт. Пусто (всё completed) или нет TodoWrite → блок.
"""
import json
import re
import sys
from pathlib import Path

ENQUEUE_RE = re.compile(
    r"(в\s+очеред\w*|поставь\s+в\s+очеред|добав\w*\s+в\s+очеред|запиши\s+в\s+очеред|"
    r"в\s+б[эе]клог|в\s+backlog|в\s+тудушк\w*|в\s+todo\b|в\s+список\s+задач|"
    r"в\s+план\s+задач|занеси\s+в\s+очеред)",
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


def _recent_boris(msgs, n=6):
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


def _last_todos(msgs):
    """Список todos из ПОСЛЕДНЕГО вызова TodoWrite в транскрипте (или None)."""
    for m in reversed(msgs):
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") == "TodoWrite"):
                return (b.get("input", {}) or {}).get("todos", [])
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    boris = _recent_boris(msgs)
    if not any(ENQUEUE_RE.search(t) for t in boris):
        sys.exit(0)  # команды «в очередь» не было
    todos = _last_todos(msgs)
    open_items = [t for t in (todos or [])
                  if isinstance(t, dict) and t.get("status") in ("pending", "in_progress")]
    if open_items:
        sys.exit(0)  # есть открытая задача в очереди — команда выполнена
    reason = (
        "НАРУШЕНИЕ check_enqueue_command: Boris сказал «в очередь», но в твоей очереди "
        "НЕТ ни одной открытой задачи (всё completed или TodoWrite не вызван). Ты сделал "
        "ОБРАТНОЕ команде — закрыл очередь вместо того, чтобы добавить новую задачу. "
        "СЕЙЧАС: вызови TodoWrite и добавь то, что велено занести, как pending, НЕ "
        "закрывай очередь и НЕ вставай — продолжай работу по ней."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
