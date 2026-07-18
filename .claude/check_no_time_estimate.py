"""Хук — режет вывод оценок ДЛИТЕЛЬНОСТИ команд в чат («~30-60 сек», «займёт пару минут»,
«это N секунд»). Работает как Stop И как PreToolUse (как check_no_ty_prav).

Класс ошибки (18.07): я к каждому запуску команды дописывал «(это ~30-60 сек)» и т.п.
Boris: без тебя знаю, перестань выводить время в сообщениях.

Ловим ТОЛЬКО короткие рантайм-оценки (сек/мин/час), НЕ трогаем проектные сроки
(недели/дни/месяцы) — они легитимны в обсуждении. Проверяем последнюю текстовую реплику,
код-блоки/инлайн-код игнорим (там могу цитировать).
"""
import json
import re
import sys
from pathlib import Path

TIME_EST_RE = re.compile(
    r"~\s*\d+\s*[-–—]?\s*\d*\s*(?:сек|секунд|мин|минут|час)|"     # ~30 сек / ~30-60 сек
    r"\b\d+\s*[-–—]\s*\d+\s*(?:сек|секунд|мин|минут|час)|"        # 30-60 сек/мин/час
    r"\b\d+\s*(?:сек\.?\b|секунд\w*|мин\.?\b|минут\w*)|"          # 60 секунд, 5 мин
    r"займ[её]т\s+[^.\n]{0,25}?(?:секунд|минут|врем|час)|"        # займёт ... времени
    r"(?:около|порядка|примерно|пар[ауеы]|несколько)\s+"
    r"(?:секунд|минут\w*|минуты)",
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
    return TIME_EST_RE.search(clean)


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
        f"НАРУШЕНИЕ check_no_time_estimate: оценка длительности «{hit.group(0)}» в чате. "
        "Boris запретил выводить время выполнения команд («~30-60 сек», «займёт минуту»). "
        "Убери — просто запусти команду. Проектные сроки (недели) не трогаем, речь про "
        "рантайм команд."
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
