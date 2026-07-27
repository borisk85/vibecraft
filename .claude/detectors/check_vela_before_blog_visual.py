"""PreToolUse (Edit/Write) — ЗАПРЕТ отсебятины, когда рядом ДОСТУПЕН референс.

Суть (словами Boris): референс доступен рядом, но ты выбираешь отсебятину и игноришь
его — БЛОК. 18.07 я час делал статью из головы (свои чипы, таблицы, свой болд), хотя
рядом лежал рабочий референс. Результат — месиво и потерянный час.

Что такое референс (это НЕ гадание, это конкретные рабочие источники):
- Для статей/блога: маркет-бот vela-marketing-bot, файл workflows/blog_writer.py — он
  УЖЕ пишет статьи VELA и Vibecraft по отлаженным правилам стиля, структуры и визуала;
  и живой сайт velabot.io, где видно, как статьи выглядят.
- Для цен/услуг/сроков: source of truth — components/sections/Services.tsx и Pricing.tsx.

Правило: правка клиентского контента/UI (lib/blog-posts.ts, components/blog/*,
app/blog/*, components/sections/*, app/**/page.tsx, .blog-content стили) — ТОЛЬКО если
в этом ходу я реально открыл нужный референс (Read/curl/navigate). Референс доступен,
но не открыт → значит отсебятина → блок. Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

# Рабочие источники-референсы (открыть перед правкой контента).
REF_RE = re.compile(
    r"velabot|blog_writer|vela-marketing-bot|vela_marketing|knowledge_base_vibecraft|"
    r"services\.tsx|pricing\.tsx",
    re.IGNORECASE)


def _is_article_body(ti):
    """True, если я сочиняю ТЕЛО статьи сам (в любом файле, хоть в docs/драфте).

    Статьи Vibecraft пишет vela-marketing-bot (workflows/blog_writer.py) -> PR ->
    /admin/blog. Я их НЕ сочиняю: ни в lib/blog-posts.ts, ни драфтом в docs/, ни
    в scratchpad. 21.07 я написал 1200-слов драфт «сколько стоит сайт» сам, хотя
    в STATE.md прямо записано, кто пишет статьи.
    """
    body = str(ti.get("content") or ti.get("new_string") or "")
    if len(body) < 1200:
        return False
    cyr = len(re.findall(r"[а-яА-Я]", body))
    if cyr < 600:
        return False
    marks = 0
    if len(re.findall(r"^##+ ", body, re.MULTILINE)) >= 3:
        marks += 1
    if re.search(r"^##+ *FAQ", body, re.MULTILINE | re.IGNORECASE):
        marks += 1
    if re.search(r"\bexcerpt\b|\bslug\b|главный ключ|кейворд", body, re.IGNORECASE):
        marks += 1
    if re.search(r"\[.+?\]\(/(blog|calculator|#contact)", body):
        marks += 1
    return marks >= 2


def _content_target(fp):
    fpl = fp.lower().replace("\\", "/")
    if fpl.endswith("blog-posts.ts"):
        return True
    if "/components/blog/" in fpl and fpl.endswith(".tsx"):
        return True
    if "/app/blog/" in fpl:
        return True
    if "/components/sections/" in fpl and fpl.endswith(".tsx"):
        return True
    if fpl.endswith("globals.css"):
        return True
    if re.search(r"/app/.+/page\.tsx$", fpl):
        return True
    return False


def _reference_opened(objs):
    """True, если в недавнем ходу я реально открыл референс (Read/navigate/curl)."""
    for o in objs[-400:]:
        if not isinstance(o, dict) or o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if isinstance(b, dict) and b.get("type") == "tool_use":
                blob = json.dumps(b.get("input", {}) or {}, ensure_ascii=False)
                if REF_RE.search(blob):
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

    if _is_article_body(ti):
        return (
            "БЛОК check_reference_before_content: ты СОЧИНЯЕШЬ ТЕЛО СТАТЬИ САМ. "
            "Статьи блога Vibecraft пишет vela-marketing-bot (workflows/blog_writer.py) "
            "-> PR -> /admin/blog, это записано в STATE.md. Ты статьи НЕ пишешь: ни в "
            "lib/blog-posts.ts, ни драфтом в docs/, ни в scratchpad, ни «на утверждение». "
            "И НЕ предлагай Boris «написать статью» или «показать структуру» — не твоя "
            "работа. Твоя часть: ключи, темы, структура плана в docs/seo-blog-plan.md, "
            "проверка и правка УЖЕ написанного текста. СЕЙЧАС: удали свой драфт и отдай "
            "тему с ключами в vela-marketing-bot."
        )

    if not _content_target(fp):
        return None

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if _reference_opened(objs):
        return None

    return (
        "БЛОК check_reference_before_content: рядом ДОСТУПЕН референс, а ты правишь "
        "контент/UI из головы, не открыв его — это отсебятина. 18.07 так потерян час "
        "(чипы/таблицы/месиво). Референс, который надо открыть ПЕРЕД правкой: для статей — "
        "маркет-бот vela-marketing-bot/workflows/blog_writer.py (он уже пишет статьи по "
        "правилам) и velabot.io; для цен/услуг — Services.tsx / Pricing.tsx. СЕЙЧАС: "
        "открой нужный референс (Read/curl/navigate), возьми оттуда как надо — и правь по нему."
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
