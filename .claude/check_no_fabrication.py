"""Хук — режет ОТСЕБЯТИНУ класса «заявляю/предлагаю действие, которого не делаю и не
контролирую» (запущу генерацию, задеплою, дам команду боту, через маркетинг-бот). Stop
И PreToolUse.

Класс ошибки (18.07): я на пустом месте предложил «скажешь генери — запущу статью через
маркетинг-бот». Я НЕ запускаю автоматизацию Boris и не генерю статьи — это выдумка про
свои возможности. Boris: хук не на один кейс, а на ЛЮБУЮ такую отсебятину.

Ловим первое лицо будущего действия в ЧУЖИХ системах/автоматизации: запущу/сгенерирую/
задеплою/разверну/настрою/подключу + бот/генерац/деплой/пайплайн/автоматиз, а также прямые
офферы «через (маркетинг-)бот», «дам команду боту», «скажешь X — запущу». Код-блоки
игнорим. Если реально делаю через тулзы (git push, npm build) — это НЕ ловится: тут про
внешние системы, к которым у меня нет доступа.
"""
import json
import re
import sys
from pathlib import Path

FABRICATION_RE = re.compile(
    r"\b(?:запущу|сгенерир\w+|задеплою|разверну|настрою|подключу|перезапущу)\b"
    r"[^.\n]{0,40}?\b(?:бот\w*|генерац\w*|деплой\w*|пайплайн\w*|автоматизац\w*|"
    r"стать\w*|воркфлоу|workflow)\b|"
    r"через\s+(?:маркетинг-?)?бот|"
    r"дам\s+команду\s+бот|"
    r"скажешь\s+[«\"']?\w+[»\"']?\s*[—:-]?\s*(?:запущу|сгенерир|задеплой|отправлю)|"
    r"я\s+(?:могу\s+)?(?:сам\s+)?(?:запуст|сгенерир|задеплой|разверн)\w*"
    r"[^.\n]{0,30}?(?:бот|стать|генерац|деплой)",
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
    # цитата запрета в «елочках» — не нарушение
    quote_spans = [(mo.start(), mo.end()) for mo in re.finditer(r"«[^»]*»", clean)]
    for m in FABRICATION_RE.finditer(clean):
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
        f"НАРУШЕНИЕ check_no_fabrication: отсебятина — «{hit.group(0)}». Ты заявляешь/"
        "предлагаешь действие в системах Boris, которое НЕ делаешь и не контролируешь "
        "(запуск генерации, деплой чужой автоматизации, команда боту). Не выдумывай свои "
        "возможности и офферы. Пиши только то, что реально можешь и что подтверждено."
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
