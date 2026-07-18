"""Единый текст-линт чата (Stop И PreToolUse) — объединяет три хука, которые делали ОДНО:
читали мою последнюю реплику и резали по паттерну. Вместо трех процессов на каждый
инструмент — один. Слиты: check_no_jargon, check_no_time_estimate, check_no_fabrication.

Класс ошибки (18.07): плодил отдельные текст-линт хуки с одинаковым механизмом. Boris:
не дублируй, консолидируй. check_no_ty_prav/filler оставлены отдельно (сложная логика).

Каждая проверка = (имя, regex, exempt_quotes, сообщение). Первое совпадение — блок.
Код-блоки/инлайн-код игнорим; «елочки» с цитатой запрета — по флагу exempt_quotes.
"""
import json
import re
import sys
from pathlib import Path

CHECKS = [
    # мудреные слова
    (re.compile(
        r"\b(?:таксономи\w*|парадигм\w*|семантик\w*|семантическ\w*|эвристик\w*|онтологи\w*|"
        r"холистичн\w*|концептуал\w*|декомпозиц\w*|абстрагир\w*|инвариант\w*|эмерджентн\w*|"
        r"ортогональн\w*|идиоматичн\w*|каноничн\w*|гранулярн\w*|номенклатур\w*|дихотоми\w*|"
        r"экстраполир\w*|гомогенн\w*|гетерогенн\w*|имманентн\w*|идемпотент\w*)\b",
        re.IGNORECASE | re.UNICODE),
     True,
     "мудреное слово «{m}» — Boris запретил умные слова, которые ничего не проясняют. "
     "Скажи простым языком (таксономия→категории, парадигма→подход, декомпозиция→разбить)."),
    # оценки длительности команд
    (re.compile(
        r"~\s*\d+\s*[-–—]?\s*\d*\s*(?:сек|секунд|мин|минут)|"
        r"\b\d+\s*[-–—]\s*\d+\s*(?:сек|секунд|мин|минут)|"
        r"\b\d+\s*(?:сек\.?\b|секунд\w*|мин\.?\b|минут\w*)|"
        r"займ[её]т\s+[^.\n]{0,25}?(?:секунд|минут|врем)|"
        r"(?:около|порядка|примерно|пар[ауеы]|несколько)\s+(?:секунд|минут\w*|минуты)",
        re.IGNORECASE | re.UNICODE),
     False,
     "оценка длительности «{m}» — Boris запретил выводить время выполнения команд. "
     "Убери, просто запусти. Проектные сроки (недели) не трогаем, речь про рантайм команд."),
    # отсебятина: заявляю действие в чужих системах
    (re.compile(
        r"\b(?:запущу|сгенерир\w+|задеплою|разверну|настрою|подключу|перезапущу)\b"
        r"[^.\n]{0,40}?\b(?:бот\w*|генерац\w*|деплой\w*|пайплайн\w*|автоматизац\w*|"
        r"стать\w*|воркфлоу|workflow)\b|"
        r"через\s+(?:маркетинг-?)?бот|дам\s+команду\s+бот|"
        r"скажешь\s+[«\"']?\w+[»\"']?\s*[—:-]?\s*(?:запущу|сгенерир|задеплой|отправлю)|"
        r"я\s+(?:могу\s+)?(?:сам\s+)?(?:запуст|сгенерир|задеплой|разверн)\w*"
        r"[^.\n]{0,30}?(?:бот|стать|генерац|деплой)",
        re.IGNORECASE | re.UNICODE),
     True,
     "отсебятина «{m}» — заявляешь действие в системах Boris, которого не делаешь и не "
     "контролируешь. Не выдумывай возможности/офферы, пиши только то, что реально можешь."),
]


def _final_assistant_text(tp):
    p = Path(tp)
    if not p.exists():
        return ""
    msgs = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            continue
    for m in reversed(msgs):
        if m.get("type") != "assistant":
            continue
        c = m.get("message", {}).get("content", [])
        if not isinstance(c, list):
            continue
        parts = [b.get("text", "") for b in c
                 if isinstance(b, dict) and b.get("type") == "text"]
        if any(t.strip() for t in parts):
            return "\n".join(parts)
    return ""


def _find(text):
    if not text.strip():
        return None
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    quote_spans = [(mo.start(), mo.end()) for mo in re.finditer(r"«[^»]*»", clean)]
    for rx, exempt, msg in CHECKS:
        for mo in rx.finditer(clean):
            if exempt and any(qs <= mo.start() and mo.end() <= qe
                              for qs, qe in quote_spans):
                continue
            return msg.replace("{m}", mo.group(0))
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
    reason = "НАРУШЕНИЕ check_chat_lint: " + hit
    if payload.get("hook_event_name") == "PreToolUse":
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }))
    else:
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
