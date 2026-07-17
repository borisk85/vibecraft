"""PreToolUse (Bash/PowerShell) — ЗАПРЕТ микро-деплоев (билд+деплой каждой мелкой правки).

Класс ошибки (18.07): я гонял `vercel --prod` после КАЖДОЙ мелкой правки (убрал слово,
подвинул пиксель, истончил линию), и Boris ждал 2-3 минуты на каждый деплой отдельно.
CLAUDE.md прямо: «Накапливать 5-6 связанных правок = один логический батч, а не 5-6
отдельных деплоев». Git push и так триггерит авто-деплой Vercel.

Правило: блок `vercel ... --prod`, если в недавнем ходу УЖЕ был `vercel --prod` (деплой
только что шёл). Накопи все правки батча и деплой ОДИН раз в конце. Первый деплой батча
проходит; повторные подряд — блок.
"""
import json
import re
import sys

# Матчим ТОЛЬКО реальный вызов команды (в начале или после &&/;/|/новой строки),
# а не текст «vercel --prod» внутри строки/сообщения коммита (иначе хук блокирует сам себя).
PROD_RE = re.compile(r"(?:^|&&|\|\||;|\n)\s*(?:npx\s+)?vercel\b[^\n]*--prod", re.IGNORECASE)
# сколько последних объектов транскрипта считаем «недавним ходом»
WINDOW = 80


def _recent_prod_deploy(objs):
    """True, если в последних WINDOW объектах уже был вызов vercel --prod."""
    for o in objs[-WINDOW:]:
        if not isinstance(o, dict) or o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") in ("Bash", "PowerShell")):
                cmd = str((b.get("input", {}) or {}).get("command", ""))
                if PROD_RE.search(cmd):
                    return True
    return False


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Bash", "PowerShell"):
        return None
    cmd = str((data.get("tool_input", {}) or {}).get("command", ""))
    if not PROD_RE.search(cmd):
        return None

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if not _recent_prod_deploy(objs):
        return None  # первый деплой батча — можно

    return (
        "БЛОК check_no_micro_deploy: ты уже деплоил `vercel --prod` совсем недавно, а "
        "теперь деплоишь снова после пары правок. Класс ошибки 18.07: билд+деплой КАЖДОЙ "
        "мелкой правки = Boris ждёт 2-3 мин на каждую, время в трубу. СЕЙЧАС: НЕ деплой. "
        "Накопи ВСЕ правки этого батча (правь файлы дальше), и когда батч готов — сделай "
        "ОДИН npm run build + ОДИН git push (авто-деплой) в конце. Не по одной правке."
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
