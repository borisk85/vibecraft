"""PreToolUse (Edit/Write/MultiEdit) — ЗАПРЕТ прыжков по задачам без очереди.

Класс ошибки (18.07): Boris кидает задачу B, пока я делаю A; я бросаю A и прыгаю на B,
ничего не ставя в очередь — порядок теряется. CLAUDE.md: новая задача в процессе = в TODO,
доделать текущую, потом следующую ПО ПОРЯДКУ.

Правило: если после последнего вызова TodoWrite Boris прислал >=2 реплики-ЗАДАЧИ
(сделай/убери/найди/унифицируй/почини/запрети/замени/удали/добавь/поправь...), а я лезу
редактировать код без обновления очереди — блок. Escape тривиальный: вызвать TodoWrite и
собрать ВСЕ задачи в очередь, потом идти по порядку.

Анти-дедлок: если очередь ещё НИ РАЗУ не заводилась (TodoWrite не было) — не блокируем
(иначе первый же Edit кирпичит, а TodoWrite мог быть зарублен другим хуком). Гейтим только
когда очередь уже существует и с неё накопились новые задачи.
"""
import json
import re
import sys

TASK_CMD_RE = re.compile(
    r"\b(сдела\w*|убер\w*|убра\w*|найд\w*|унифиц\w*|почини\w*|починил|запрет\w*|"
    r"замен\w*|удали\w*|поставь|добавь|исправь\w*|поменяй|перенеси|верни|внедри|"
    r"поправь|переименуй|поплыл\w*|съехал\w*|уехал\w*|сломал\w*|наеха\w*|плыв\w*|"
    r"съезжа\w*)\b|не\s+работает|\bбаг\b|криво\b",
    re.IGNORECASE | re.UNICODE)

_SVC = ("НАРУШЕНИЕ", "БЛОК check", "check_", "Stop hook feedback", "system-reminder",
        "hookSpecificOutput", "hook additional context")


def _is_real_boris(o):
    if not isinstance(o, dict) or o.get("type") != "user":
        return False
    content = (o.get("message", {}) or {}).get("content")
    text = ""
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        if content and all(isinstance(b, dict) and b.get("type") == "tool_result"
                           for b in content):
            return False
        text = " ".join(b.get("text", "") for b in content
                        if isinstance(b, dict) and b.get("type") == "text")
    text = text.strip()
    if not text or any(m in text for m in _SVC):
        return False
    return text


def _has_todowrite(o):
    if not isinstance(o, dict) or o.get("type") != "assistant":
        return False
    content = (o.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return False
    return any(isinstance(b, dict) and b.get("type") == "tool_use"
               and b.get("name") == "TodoWrite" for b in content)


def _tasks_since_last_todo(objs):
    last_todo = -1
    for i, o in enumerate(objs):
        if _has_todowrite(o):
            last_todo = i
    if last_todo == -1:
        return 0  # очередь ещё ни разу не заводилась — не бричить правки (анти-дедлок)
    count = 0
    for o in objs[last_todo + 1:]:
        text = _is_real_boris(o)
        if text and TASK_CMD_RE.search(text):
            count += 1
    return count


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    fp = str((data.get("tool_input", {}) or {}).get("file_path", "")).replace("\\", "/")
    if "/.claude/" in fp.lower():
        return None  # правки самих хуков не гейтим

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if _tasks_since_last_todo(objs) < 1:
        return None

    return (
        "БЛОК check_queue_before_switch: с последней очереди (TodoWrite) прилетело >=2 "
        "новых задачи от Boris, а ты лезешь править код, не собрав их в очередь — так ты "
        "прыгаешь между задачами и теряешь порядок. СНАЧАЛА вызови TodoWrite: внеси ВСЕ "
        "задачи по порядку прилёта, отметь одну in_progress. Потом иди строго по очереди."
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
