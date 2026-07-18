"""Хук — режет «мудреные» слова в чате, которые ничего не проясняют для Boris
(таксономия, парадигма, семантика, консистентность и т.п.). Stop И PreToolUse.

Класс ошибки (18.07): я вставил в чат слово «таксономия». Boris: говори простым языком,
без умных слов, которые ничего не объясняют. И боится, что на след. сессии забуду —
поэтому это хук (файл, живет между сессиями), а не обещание.

Ловим ТОЛЬКО книжно-научный жаргон с простым русским эквивалентом. Технические слова,
которые Boris понимает и сам использует (PR, commit, deploy, API, webhook, билд, хук,
пуш, коммит), — НЕ трогаем. Код-блоки/инлайн-код игнорим.
"""
import json
import re
import sys
from pathlib import Path

# Стемы книжно-научных слов. Подставляй простое: таксономия→категории/разбивка,
# парадигма→подход, семантика→смысл, консистентность→единообразие,
# декомпозиция→разбить на части, детерминированный→предсказуемый/четкий.
JARGON_RE = re.compile(
    r"\b(?:"
    r"таксономи\w*|парадигм\w*|семантик\w*|семантическ\w*|эвристик\w*|онтологи\w*|"
    r"холистичн\w*|концептуал\w*|декомпозиц\w*|абстрагир\w*|инвариант\w*|"
    r"эмерджентн\w*|ортогональн\w*|идиоматичн\w*|каноничн\w*|гранулярн\w*|"
    r"номенклатур\w*|дихотоми\w*|экстраполир\w*|гомогенн\w*|гетерогенн\w*|"
    r"имманентн\w*|идемпотент\w*"
    r")\b",
    re.IGNORECASE | re.UNICODE)


def _final_assistant_text(transcript_path: str) -> str:
    p = Path(transcript_path)
    if not p.exists():
        return ""
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    for msg in reversed(messages):
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if any(t.strip() for t in parts):
            return "\n".join(parts)
    return ""


def _find(text: str):
    if not text.strip():
        return None
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    # цитата запрета в «елочках» — не нарушение (могу называть само слово)
    quote_spans = [(mo.start(), mo.end()) for mo in re.finditer(r"«[^»]*»", clean)]
    for m in JARGON_RE.finditer(clean):
        if any(qs <= m.start() and m.end() <= qe for qs, qe in quote_spans):
            continue
        return m
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp:
        sys.exit(0)
    hit = _find(_final_assistant_text(tp))
    if not hit:
        sys.exit(0)
    msg = (
        f"НАРУШЕНИЕ check_no_jargon: мудреное слово «{hit.group(0)}» в чате. Boris запретил "
        "умные слова, которые ничего не проясняют. Скажи простым языком (таксономия→"
        "категории, парадигма→подход, семантика→смысл, декомпозиция→разбить на части)."
    )
    if payload.get("hook_event_name") == "PreToolUse":
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": msg,
            }
        }))
    else:
        print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
