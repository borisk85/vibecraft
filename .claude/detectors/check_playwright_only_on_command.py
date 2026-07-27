"""PreToolUse hook — Playwright (браузер) ТОЛЬКО по явной команде Boris.

Класс ошибки (rule 0 «никакой самодеятельности» + feedback_no_playwright_without_command):
я сам полез в браузер «подавать бэклинки», хотя команды на это не было — Boris
задавал вопрос/возмущался, а я запустил активность от себя. Правило существовало,
но не было закреплено хуком.

Механизм: любой вызов mcp__playwright__* блокируется, если в последних сообщениях
Boris НЕТ явной команды на браузер/рендер/скрин/проверку в браузере. Тогда —
СТОП, не лезть в браузер, спросить/дождаться явной команды.
"""
import json
import re
import sys

ALLOW_RE = re.compile(
    r"(плейрайт|playwright|\bбраузер|в\s+браузере|отрендер|\bрендер|отрисуй|"
    r"скрин\w*|screenshot|сфотк|как\s+выглядит|"
    r"посмотри\s+(?:на\s+|в\s+)?(?:сайт|браузер|прод|живой|виджет|мокап)|"
    r"откр\w*\s+(?:сайт|чат|виджет|страниц)|чат.?бот\s+на\s+сайт|зайди\s+на|"
    r"живой\s+сайт|проверь\s+(?:прод|сайт|в\s+браузере|верстк\w*|виджет|мокап))",
    re.IGNORECASE | re.UNICODE,
)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _recent_boris(lines, n=5):
    out = []
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "user" or o.get("isMeta"):
            continue
        c = (o.get("message", {}) or {}).get("content")
        text = ""
        if isinstance(c, str):
            text = c
        elif isinstance(c, list):
            if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                continue
            text = " ".join(
                b.get("text", "") for b in c
                if isinstance(b, dict) and b.get("type") == "text"
            )
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S).strip()
        if not text or any(m in text for m in SERVICE_MARKERS):
            continue
        out.append(text)
        if len(out) >= n:
            break
    return out


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if not str(data.get("tool_name", "")).startswith("mcp__playwright__"):
        return None
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    boris = _recent_boris(lines)
    if boris and ALLOW_RE.search(" ".join(boris)):
        return None  # явная команда на браузер есть
    return (
        "БЛОК check_playwright_only_on_command: ты вызываешь Playwright (браузер) без "
        "явной команды Boris. В его недавних сообщениях нет команды на браузер/рендер/"
        "скрин/проверку в браузере. Это самодеятельность (rule 0). СТОП: не лезь в "
        "браузер от себя, дождись явной команды («иди в плейрайт», «отрендери», "
        "«проверь на сайте», «открой виджет» и т.п.)."
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
