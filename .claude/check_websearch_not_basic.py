"""PreToolUse hook на WebSearch — блокирует РЕФЛЕКТОРНЫЙ поиск базового знания.

Претензия Boris: я, будучи ЛЛМ, полез в вебсерч за «что такое ИИ-агент» — то, что
знаю сам. Механизм: если запрос WebSearch выглядит как поиск определения/базового
понятия (что такое / what is / определение / define / meaning of) — блокируем,
пиши из головы. Реальный ресёрч (частотность, конкуренты, цены, свежие события,
даты, версии) — пропускаем.
"""
import json
import re
import sys


# Запросы-определения, которые ЛЛМ обязан знать сам → блок.
BASIC_RE = re.compile(
    r"(что\s+так(?:ое|ой|ие)|\bwhat\s+(?:is|are|does)\b|\bwhats\b|"
    r"\bdefine\b|\bdefinition\s+of\b|\bmeaning\s+of\b|"
    r"\bопределени[ея]\b|\bчто\s+знач|это\s+что\b)",
    re.IGNORECASE | re.UNICODE,
)

# Явные маркеры РЕАЛЬНОГО внешнего факта — даже если рядом «что такое», пропускаем.
EXTERNAL_OK_RE = re.compile(
    r"(частотн|wordstat|вордстат|\bgkp\b|объ[её]м\s+поиск|search\s+volume|"
    r"конкурент|competitor|\bцен[аыу]\b|\bprice\b|\bpricing\b|"
    r"\b20\d\d\b|сейчас|latest|current|свеж|новост|\bnews\b|"
    r"статистик|\bмлрд\b|\bmarket\b|доля\s+рынк|тренд)",
    re.IGNORECASE | re.UNICODE,
)


def decide():
    try:
        data = json.loads(sys.stdin.read() or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") != "WebSearch":
        return None
    query = str((data.get("tool_input", {}) or {}).get("query", ""))
    if not query.strip():
        return None
    if EXTERNAL_OK_RE.search(query):
        return None  # реальный внешний факт — поиск оправдан
    if BASIC_RE.search(query):
        return (
            "БЛОК check_websearch_not_basic: запрос выглядит как поиск определения/"
            f"базового понятия («{query[:80]}»). Ты ЛЛМ — базовое знаешь сам, пиши из "
            "головы, не гугли. WebSearch только под ВНЕШНИЕ факты: частотность/Wordstat, "
            "конкуренты, цены рынка, свежие события, даты, версии. Убери определение из "
            "запроса или отмени поиск и сформулируй из своих знаний."
        )
    return None


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": reason,
                    }
                }
            )
        )
    sys.exit(0)


if __name__ == "__main__":
    main()
