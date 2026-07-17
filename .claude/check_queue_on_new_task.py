"""Stop hook — ЭНФОРСЕР ОЧЕРЕДИ. Блокирует прыжки между задачами.

Претензия Boris (в сотый раз): я бросаю текущую задачу и прыгаю на новую вместо
того чтобы ставить новый запрос в очередь. Механизм, не слова:

Если в последнем сообщении Boris есть НОВАЯ задача/претензия (task-like), а я в
этом ходу НЕ вызвал TodoWrite (не обновил очередь) — блокируем. Заставляет меня
всегда сначала занести новый ввод в очередь, а не молча прыгать на него.
"""
import json
import re
import sys
from pathlib import Path


# Сигналы новой задачи/претензии Boris (императивы + флаги брака).
# Только КОНКРЕТНЫЕ приказы-императивы на работу. НЕ ловим слова-претензии/мат
# («хуйня», «каша», «дубли», «воздух», «не годится») — они летят в потоке ругани
# без реальной новой задачи и раньше заставляли дёргать TodoWrite на каждый мат.
TASK_RE = re.compile(
    r"\b("
    r"почини|чини|исправ\w*|сделай|доделай|переделай|переделк\w*|"
    r"перепиш\w*|перепис\w*|добав\w*|убер\w*|убра\w*|поправ\w*|прав(?:ь|ка|ки)\b|"
    r"замен\w*|помен\w*|мен(?:яй|яю)\b|"
    r"ресерч\w*|research|проверь|сверь|сверить|сверя\w*|"
    r"вставь|вставля\w*|вкати|выкати|деплой\w*|запуш\w*|коммит\w*"
    r")\b",
    re.IGNORECASE | re.UNICODE,
)


def _get_last_user_text(messages) -> str:
    """Текст последнего человеческого сообщения (не tool_result)."""
    for msg in reversed(messages):
        if msg.get("type") != "user":
            continue
        content = msg.get("message", {}).get("content", [])
        if isinstance(content, list):
            if content and all(
                isinstance(b, dict) and b.get("type") == "tool_result" for b in content
            ):
                continue  # это результат тула, не человек
            parts = [
                b.get("text", "")
                for b in content
                if isinstance(b, dict) and b.get("type") == "text"
            ]
            return " ".join(parts)
        if isinstance(content, str):
            return content
    return ""


def _last_human_index(messages) -> int:
    idx = -1
    for i, msg in enumerate(messages):
        if msg.get("type") != "user":
            continue
        content = msg.get("message", {}).get("content", [])
        is_tool = (
            isinstance(content, list)
            and content
            and all(isinstance(b, dict) and b.get("type") == "tool_result" for b in content)
        )
        if not is_tool:
            idx = i
    return idx


def _todowrite_called_after(messages, start_idx) -> bool:
    """True, если после последнего человеческого сообщения я вызвал TodoWrite."""
    for msg in messages[start_idx + 1:]:
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        for b in content:
            if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "TodoWrite":
                return True
    return False


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    transcript_path = payload.get("transcript_path")
    if not transcript_path or not Path(transcript_path).exists():
        sys.exit(0)

    messages = []
    for line in Path(transcript_path).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue

    last_user = _get_last_user_text(messages)
    if not last_user.strip():
        sys.exit(0)

    # новая задача/претензия?
    if not TASK_RE.search(last_user):
        sys.exit(0)

    idx = _last_human_index(messages)
    if idx == -1:
        sys.exit(0)

    if _todowrite_called_after(messages, idx):
        sys.exit(0)  # очередь обновил — ок

    reason = (
        "НАРУШЕНИЕ check_queue: Boris дал новую задачу/претензию, но ты НЕ обновил "
        "очередь через TodoWrite в этом ходу. ЗАПРЕЩЕНО прыгать на новый запрос молча. "
        "Сначала вызови TodoWrite: не бросай текущую in_progress задачу, добавь новый "
        "ввод в pending, работай строго по очереди. Потом продолжай."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
