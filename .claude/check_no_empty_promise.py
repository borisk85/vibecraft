"""Stop hook — блокирует ПУСТОЕ ОБЕЩАНИЕ отложенной работы «сам потом/дожму сам».

Класс ошибки: я пишу «дожму сам по мелочи / доделаю потом / вернусь к этому»,
но у меня НЕТ памяти между сессиями — к новой сессии это испарится, работа не
сделается. Boris в ярости: обещание = наёб. Правило: либо СДЕЛАТЬ сейчас (в этом
же ходу tool-call), либо ЗАПИСАТЬ конкретным шагом в repo-файл (docs/*.md/TODO).
Отложить «на будущего себя» нельзя.

Механизм: если в ответе есть обещание отложенной работы И в ответе НЕТ признака,
что оно записано в файл (docs/, .md, «записал в …»), — блок.
"""
import json
import re
import sys
from pathlib import Path

FUTURE_PROMISE_RE = re.compile(
    r"(дожму\s+сам|дожму\s+(?:потом|позже)|дожать\s+сам|"
    r"сделаю\s+(?:это\s+)?(?:потом|позже)|сам\s+(?:потом|позже)\s+сделаю|"
    r"потом\s+(?:добавлю|сделаю|доделаю|дожму|поправлю)|"
    r"поз(?:же|днее)\s+(?:добавлю|сделаю|доделаю|поправлю)|"
    r"верну\w+\s+к\s+этому|при\s+случае|в\s+следующ\w+\s+раз|"
    r"отдельным\s+заходом|доделаю\s+(?:потом|позже|сам)|"
    # обещание ответить другим сообщением вместо ответа сейчас (12.07: «отвечаю
    # следующим сообщением» — и встал, Boris ждал впустую)
    r"(?:отвеча\w+|отвечу|дам|покажу|расскажу|распишу)\s+(?:следующим\s+сообщением|в\s+следующем\s+сообщении|следующим\s+ответом|отдельным\s+сообщением)|"
    r"следующим\s+сообщением\s+(?:отвеч\w+|дам|покажу|расскажу)|"
    r"отвечу\s+(?:отдельно|ниже|позже|следом)|ниже\s+отвечу|"
    r"доработаю\s+сам|напомню\s+себе|как-нибудь\s+потом|по\s+мелочи\s+сам)",
    re.IGNORECASE | re.UNICODE,
)

PERSIST_RE = re.compile(
    r"(записал\s+в|в\s+файл|docs/|\.md\b|\bTODO\b|в\s+репо|"
    r"очеред\w*\s+(?:в\s+файле|репо|\.md)|BACKLINKS|PEREVOD|GEO_|MARKETING_|"
    r"\bбэклог\b|в\s+заметк\w+\s+репо|добавил\s+в\s+файл|шаг\w*\s+в\s+файл)",
    re.IGNORECASE | re.UNICODE,
)

META_RE = re.compile(
    r"(хук|правил|запрет|обещан|\bпамят|испар|persist|стоп.?лист|блокир|ловит)",
    re.IGNORECASE | re.UNICODE,
)


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
    clean = re.sub(r"```[\s\S]*?```", "", resp)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))

    m = FUTURE_PROMISE_RE.search(clean)
    if not m:
        sys.exit(0)
    # вокруг обещания — обсуждение самого запрета/памяти? тогда не блок
    s = clean.rfind(".", 0, m.start()); s = s + 1 if s != -1 else 0
    e = clean.find(".", m.end());       e = e if e != -1 else len(clean)
    if META_RE.search(clean[s:e]):
        sys.exit(0)
    if PERSIST_RE.search(clean):
        sys.exit(0)  # обещание записано в файл — ок
    reason = (
        f"НАРУШЕНИЕ check_no_empty_promise: в ответе обещание отложенной работы "
        f"«{m.group(0)}». У тебя НЕТ памяти между сессиями — к новой сессии это "
        "испарится, работа не будет сделана = наёб. Либо СДЕЛАЙ сейчас (tool-call в "
        "этом же ходу), либо ЗАПИШИ конкретным шагом в repo-файл (docs/*.md) и укажи "
        "куда записал. Обещать «сам потом» нельзя."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
