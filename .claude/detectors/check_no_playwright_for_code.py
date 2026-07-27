"""PreToolUse (mcp__playwright__*) — ЗАПРЕТ Playwright, когда задача чисто КОДОВАЯ.

Класс ошибки (18.07): я лез в Playwright на каждую мелочь (унифицировать классы кнопок,
убрать элемент, найти по коду) и тянул время. Boris: не смотри через плейрайт, когда
надо просто найти по коду и сделать без UI.

Правило: блок browser_* (navigate/screenshot/snapshot/evaluate/click/resize), если
последняя задача Boris — КОДОВАЯ (найди/унифицируй/убери/замени/удали/рефактор/в коде/хук/
переименуй) И в ней НЕТ реальной нужды видеть РЕНДЕР (посмотри/как выглядит/скрин/съехал/
наезжает/перекрывает/уродство/гор-скролл/гамбургер/ховер/не влезает). Визуальный баг,
который надо УВИДЕТЬ, — Playwright разрешён.
"""
import json
import re
import sys

CODE_TASK_RE = re.compile(
    r"найд|унифиц|убер|убра|удал|замен|рефактор|в\s+коде|сдела\w*\s+хук|переименуй|"
    r"почини\s+в\s+коде|прогони|найти\s+все\s+места",
    re.IGNORECASE | re.UNICODE)

# Реальная нужда УВИДЕТЬ рендер.
VISUAL_NEED_RE = re.compile(
    r"посмотр(и|еть)|как\s+выгляд|как\s+ляж|как\s+льёт|\bскрин|съехал|уехал|наезжа|"
    r"перекрыва|не\s+влезае|уродств|гор(изонт)?\.?\s*скролл|скролл.{0,15}страниц|"
    r"гамбургер|\bховер\b|\bhover\b|проверь\s+визуал|на\s+моб|на\s+планшет",
    re.IGNORECASE | re.UNICODE)

_SVC = ("НАРУШЕНИЕ", "БЛОК check", "check_", "Stop hook feedback", "system-reminder",
        "hookSpecificOutput", "hook additional context")


def _recent_boris(objs, n=5):
    out = []
    for o in reversed(objs):
        if not isinstance(o, dict) or o.get("type") != "user":
            continue
        content = (o.get("message", {}) or {}).get("content")
        text = ""
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            if content and all(isinstance(b, dict) and b.get("type") == "tool_result"
                               for b in content):
                continue
            text = " ".join(b.get("text", "") for b in content
                            if isinstance(b, dict) and b.get("type") == "text")
        text = text.strip()
        if not text or any(m in text for m in _SVC):
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
    if "browser_" not in str(data.get("tool_name", "")):
        return None
    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    boris = _recent_boris(objs)
    if not boris:
        return None
    blob = "\n".join(boris)
    # если есть реальная нужда увидеть рендер — Playwright можно
    if VISUAL_NEED_RE.search(blob):
        return None
    # кодовая задача без визуальной нужды — Playwright не нужен
    if not CODE_TASK_RE.search(blob):
        return None
    return (
        "БЛОК check_no_playwright_for_code: задача кодовая (найти/унифицировать/убрать по "
        "коду), а ты лезешь в Playwright и тянешь время. Класс ошибки 18.07: Boris запретил "
        "смотреть через браузер, когда надо просто сделать по коду без UI. СДЕЛАЙ по коду: "
        "Grep/Read найди нужные места, поправь Edit'ом, прогони билд. Браузер — только когда "
        "реально надо УВИДЕТЬ рендер (визуальный баг: съехало/уродство/скролл/ховер)."
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
