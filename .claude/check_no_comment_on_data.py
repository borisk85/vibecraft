"""Stop hook — НЕ комментировать присланные ДАННЫЕ без команды.

Boris (14.07): скинул админ-дайджест VELA без вопроса/команды, я выдал оценку
(«скромный день, база спит, удержание держать в голове»). Boris: «рот закрой, не было
команды комментировать, скинули без команды — молча прими». Хук: если ПОСЛЕДНЕЕ
сообщение Boris = ДАННЫЕ (дайджест/статистика/лог с цифрами) БЕЗ вопроса и БЕЗ команды,
а я отвечаю прозой-комментарием — блок. Правильно = молчание или короткое «принял».
"""
import json
import re
import sys
from pathlib import Path

DATA_MARKERS = re.compile(
    r"(📊|статистика|активных ботов|сообщени|топ по|usage|тариф|"
    r"новых юзеров|активных юзеров|дайджест|подписчик|выручк|mrr|конверси)",
    re.IGNORECASE | re.UNICODE,
)
CMD_MARKERS = re.compile(
    r"\?|сделай|почини|добавь|убери|запиши|ответь|проверь|покажи|оцени|разбери|"
    r"что думаешь|почему|зачем|как\b|нужно ли|стоит ли|исправь|поправь|создай|"
    r"настрой|напиши|перепиши|удали|помети|хватает",
    re.IGNORECASE | re.UNICODE,
)


def _is_tool_result(m: dict) -> bool:
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def _text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            b.get("text", "") for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return ""


def main():
    try:
        p = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if p.get("stop_hook_active"):
        sys.exit(0)
    tp = p.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            continue
    last_user = None
    for m in msgs:
        if m.get("type") == "user" and not _is_tool_result(m):
            last_user = _text(m.get("message", {}).get("content", ""))
    if not last_user:
        sys.exit(0)
    if not DATA_MARKERS.search(last_user):
        sys.exit(0)
    if CMD_MARKERS.search(last_user):
        sys.exit(0)  # есть вопрос/команда — отвечать можно
    # мой финальный ответ
    final = ""
    for m in reversed(msgs):
        if m.get("type") == "assistant":
            parts = [
                b.get("text", "") for b in m.get("message", {}).get("content", [])
                if isinstance(b, dict) and b.get("type") == "text"
            ]
            if any(t.strip() for t in parts):
                final = "\n".join(parts)
                break
    if len(final.strip()) <= 15:
        sys.exit(0)  # короткое «принял» — ок
    print(json.dumps({"decision": "block", "reason": (
        "НАРУШЕНИЕ check_no_comment_on_data: Boris скинул ДАННЫЕ (дайджест/статистику) "
        "БЕЗ вопроса и команды, а ты комментируешь/оцениваешь. ЗАПРЕЩЕНО. Молча прими "
        "или коротко «принял». Анализ/оценку/выводы — ТОЛЬКО если он явно спросил."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()
