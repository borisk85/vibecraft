"""Stop hook — блокирует ответы, которые ОТКРЫВАЮТСЯ словом-заполнителем пустоты
или содержат строку-пустышку из одного такого слова.

Класс ошибки: я начинаю ответ с пустого «Тут / Здесь / Ок / Понял / Принял /
Ясно / Итак / Ладно», которое ничего не несёт и бесит Boris (см. no_tut, no_ok,
no_ponyal, no_prinyal, no_slyshu). Правило: ответ начинается СРАЗУ с сути или
действия, без пустых подводок-филлеров.
"""
import json
import re
import sys
from pathlib import Path

# Филлеры, которыми нельзя ОТКРЫВАТЬ ответ (или строку).
FILLER = (
    r"тут|здесь|ок|окей|окэй|понял\w*|принял\w*|принято|ясно|угу|ага|"
    r"слышу|итак|ладно|хорошо|ну что|что ж|ну,|значит,|как скажешь|"
    r"так,|окей,|хмм|эх|увы,|что ж\."
)
OPEN_RE = re.compile(rf"^\s*(?:{FILLER})\b\s*[\s,.!:;—-]*", re.IGNORECASE | re.UNICODE)
LINE_RE = re.compile(rf"^\s*(?:{FILLER})\s*[.!…]*\s*$", re.IGNORECASE | re.UNICODE)


def _is_tool_result(msg):
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def _last_response(msgs):
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            last_human = i
    parts = []
    for m in msgs[last_human + 1:]:
        if m.get("type") != "assistant":
            continue
        c = m.get("message", {}).get("content", [])
        if isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "text":
                    parts.append(b.get("text", ""))
    return "\n".join(parts)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    resp = _last_response(msgs)
    if not resp.strip():
        sys.exit(0)
    # code-block снять
    clean = re.sub(r"```[\s\S]*?```", "", resp).strip()
    if not clean:
        sys.exit(0)

    hit = None
    if OPEN_RE.match(clean):
        hit = OPEN_RE.match(clean).group(0).strip()
    else:
        for ln in clean.splitlines():
            if LINE_RE.match(ln):
                hit = ln.strip()
                break
    if hit:
        reason = (
            f"НАРУШЕНИЕ check_no_filler: ответ открывается/содержит слово-заполнитель "
            f"«{hit}». Это пустая подводка, которая бесит Boris. Начинай ответ СРАЗУ с "
            "сути или действия, без «тут/здесь/ок/понял/принял/ясно/итак/ладно» и подобного."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
