"""PreToolUse (Edit/Write) — ЗАПРЕТ визуал/стиль-правок блога без сверки с VELA.

Класс ошибки (18.07): Boris много раз повторил «референс на вела как рабочий флоу
статей». Я делал визуал статьи (чипы на цены, цветная таблица, болд в теле) ИЗ ГОЛОВЫ,
не посмотрев, как это сделано на velabot.io → месиво → потерян час. Срез по 5 статьям
VELA: 5-6 КАРТИНОК на статью, 0 таблиц, 0 чипов, 0 выносок. Я изобретал то, чего в
референсе нет вообще.

Правило: правка визуала/разметки блога — ТОЛЬКО после того, как в недавнем ходу был
реальный заход на velabot.io (browser_navigate ИЛИ curl velabot). Гейтим:
- app/globals.css (там живут стили .blog-content),
- components/blog/*.tsx,
- lib/blog-posts.ts, если правка добавляет/меняет markup (<code>, таблица |---|, **,
  бэктики, ##/###, <img>, <figure>).
Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

MARKUP_RE = re.compile(r"<code|<table|<figure|<img|\|\s*-{2,}|\*\*|`|^#{2,}\s|</", re.MULTILINE)
VELA_RE = re.compile(r"velabot\.io|velabot", re.IGNORECASE)


def _blog_visual_target(fp, payload):
    fpl = fp.lower()
    if "/components/blog/" in fpl and fpl.endswith(".tsx"):
        return True
    if fpl.endswith("/globals.css") or fpl.endswith("globals.css"):
        return True
    if fpl.endswith("blog-posts.ts") and MARKUP_RE.search(payload):
        return True
    return False


def _vela_consulted(objs):
    """True, если в недавнем ходу был заход на velabot (navigate/curl/fetch)."""
    for o in objs[-90:]:
        if not isinstance(o, dict) or o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if isinstance(b, dict) and b.get("type") == "tool_use":
                blob = json.dumps(b.get("input", {}) or {}, ensure_ascii=False)
                if VELA_RE.search(blob):
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
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if "/.claude/" in fp.lower():
        return None
    payload = str(ti.get("new_string", "")) + "\n" + str(ti.get("content", ""))
    if not _blog_visual_target(fp, payload):
        return None

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if _vela_consulted(objs):
        return None

    return (
        "БЛОК check_vela_before_blog_visual: правишь визуал/разметку блога, но в этом ходу "
        "НЕ сверился с референсом VELA. Класс ошибки 18.07: делал чипы и цветную таблицу из "
        "головы — месиво, потерян час. Срез VELA: 5-6 картинок на статью, 0 таблиц, 0 чипов, "
        "0 выносок. СЕЙЧАС: сначала открой velabot.io/blog (browser_navigate или curl), "
        "посмотри как реально сделан визуал в статьях, и правь ПО референсу, а не из головы."
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
