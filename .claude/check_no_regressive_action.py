"""PreToolUse hook (Edit/Write) — ЗАПРЕТ регрессивных ДЕЙСТВИЙ: отключать/убирать
фичу или требование, чтобы «обойти» проблему, вместо правильного решения.

Класс ошибки (2026-07-17): у Boris нет скринов под статью, а я вместо того чтобы их
ПРОИЗВЕСТИ, полез править бот — «СКРИНШОТЫ ОТМЕНЕНЫ, не вставляй». Регресс в ДЕЙСТВИИ:
выпилил нужную фичу (скрины важны для SEO/качества) ради обхода. check_no_regressive_
advice ловит только слова-совет, а тут была ПРАВКА. Boris: где хук защита от регрессии
в действиях?

Правило: Edit/Write, который ОТКЛЮЧАЕТ/УБИРАЕТ фичу/правило/требование (скрины,
проверки, разделы промпта, валидацию и т.п.) как обход проблемы — блок, если в
подводке перед инструментом нет обоснования данными/целью или прямой команды Boris
убрать. Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

# Новый текст ОТКЛЮЧАЕТ/УБИРАЕТ фичу или требование.
DISABLE_RE = re.compile(
    r"(отмен[еён]\w*|отключ\w*|не\s+вставля\w*|\bне\s+нужн\w*|\bубрать\b|убер\w*|"
    r"выпил\w*|снять\s+требован|не\s+распростран\w*|перекрывает\s+[^.\n]{0,40}правил|"
    r"запрет\w*\s+(?:скрин|фич|раздел|провер|валидац|маркер)|отказ\w*\s+от\s+"
    r"(?:скрин|провер|валидац|фич)|\bбез\s+(?:скрин|провер|валидац)|"
    r"пуст\w*\s+масс\w*\s*\[\s*\])",
    re.IGNORECASE | re.UNICODE)

# Обоснование убрать (данные/цель/команда Boris) — снимает блок.
JUSTIFY_RE = re.compile(
    r"(boris\s+вел\w*\s+убра|boris\s+сказал\s+убра|по\s+данным|не\s+окупа\w*|"
    r"дубл\w*\s+фич|мертв\w*\s+код|deprecat|устарел\w*\s+и\s+заменен|"
    r"команд\w*\s+boris\s+на\s+удал|Boris\s+прямо\s+просил\s+убрать)",
    re.IGNORECASE | re.UNICODE)


def _last_assistant_text(lines):
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if parts:
            return "\n".join(parts)
    return ""


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
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if "/.claude/" in fp:
        return None  # правки самих хуков не гейтим
    payload = str(ti.get("new_string", "")) + "\n" + str(ti.get("content", ""))
    if not DISABLE_RE.search(payload):
        return None
    tp = data.get("transcript_path")
    lead = ""
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                lead = _last_assistant_text(f.read().splitlines())
        except Exception:
            lead = ""
    # обоснование либо в подводке, либо в самом вставляемом тексте
    if JUSTIFY_RE.search(lead) or JUSTIFY_RE.search(payload):
        return None
    hit = DISABLE_RE.search(payload).group(0)
    return (
        f"БЛОК check_no_regressive_action: этой правкой ты ОТКЛЮЧАЕШЬ/УБИРАЕШЬ фичу или "
        f"требование («{hit.strip()}») — это регресс в ДЕЙСТВИИ. Класс ошибки 17.07: у "
        "Boris нет скринов, а ты вместо того чтобы их произвести, правил бот «отменить "
        "скрины». Нельзя выпиливать нужное (скрины важны для SEO/качества), чтобы обойти "
        "проблему. СТОП: реши правильно — ПРОИЗВЕДИ недостающее (сгенерируй/добавь), а не "
        "гаси фичу. Если убрать реально надо — в подводке обоснуй данными/целью или сошлись "
        "на прямую команду Boris убрать."
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
