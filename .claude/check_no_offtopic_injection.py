"""Stop hook — блокирует ответ, если я ПРИТЯНУЛ тему/шаги, которых Boris не
поднимал в своём сообщении (самодеятельность в тексте ответа).

Класс ошибки (повторяется): Boris спрашивает про X (угол/перевод), а я в ответ
приписываю Y, которого он не просил и которое уже закрыто («пара бэклинков на
статью», хотя бэклинки VELA пройдены и тема снята). Он в ярости: «откуда вылез,
вопрос не поднимался». Rule 0 — никакой самодеятельности, в т.ч. в тексте.

Механизм:
1) ЗАКРЫТЫЕ ТЕМЫ (Boris явно закрыл/запретил поднимать без повода). Если такая
   тема есть в моём ответе, а в недавних сообщениях Boris её НЕТ — блок.
2) Непрошенная приписка «что ещё сделать / рекомендую / следующие шаги», когда
   Boris НЕ просил план/варианты/next — блок.
"""
import json
import re
import sys
from pathlib import Path

# Темы, которые Boris закрыл — не поднимать без его явного упоминания.
CLOSED_TOPICS = re.compile(r"(бэклинк|backlink|обратн\w+\s+ссылк)", re.IGNORECASE | re.UNICODE)

# Признак непрошенной приписки-предложения в моём ответе.
SUGGEST_RE = re.compile(
    r"(что\s+от\s+тебя|осталось\s+сделать|рекомендую|предлагаю\b|"
    r"можно\s+(?:ещё|еще|также)|также\s+(?:можно|стоит)|в\s+дополнение|"
    r"следующ\w+\s+шаг|next\s+step|сто[ие]т\s+(?:ещё|еще|также))",
    re.IGNORECASE | re.UNICODE,
)

# Boris сам попросил план/варианты/next — тогда приписка законна.
REQUEST_RE = re.compile(
    r"(план|что\s+делать|что\s+(?:ещё|еще)\s+(?:можно|сделать)|вариант|"
    r"как\s+усилить|что\s+от\s+меня|что\s+делаешь\s+ты|дальше\s+что|"
    r"предлож|next|расшат|раскач|качн\w*\s+угол|качнуть|что\s+можно\s+сделать|"
    r"список|очеред|канал|думай)",
    re.IGNORECASE | re.UNICODE,
)


def _is_tool_result(msg):
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def _load(tp):
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    return msgs


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
    return "\n".join(parts), last_human


def _boris_recent(msgs, last_human):
    out = []
    for m in msgs[max(0, last_human - 6):last_human + 1]:
        if m.get("type") != "user" or _is_tool_result(m) or m.get("isMeta"):
            continue
        c = m.get("message", {}).get("content")
        if isinstance(c, str):
            out.append(c)
        elif isinstance(c, list):
            out.append(" ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text"))
    return " ".join(out)


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
    msgs = _load(tp)
    resp, last_human = _last_response(msgs)
    if not resp.strip():
        sys.exit(0)
    # чистим код-блоки и цитаты Boris (>)
    clean = re.sub(r"```[\s\S]*?```", "", resp)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    boris = _boris_recent(msgs, last_human)

    # 1) закрытая тема в ответе, которой нет у Boris
    if CLOSED_TOPICS.search(clean) and not CLOSED_TOPICS.search(boris):
        # разрешить, если я сам её СНИМАЮ (обсуждаю запрет), а не поднимаю как задачу
        meta = re.search(r"(снима\w+|закрыл|не\s+в\s+тему|не\s+подним|хук|правил|запрет)", clean, re.I | re.U)
        if not meta:
            print(json.dumps({"decision": "block", "reason": (
                "НАРУШЕНИЕ check_no_offtopic_injection: в ответе поднята ЗАКРЫТАЯ тема "
                "(бэклинки/обратные ссылки), которой Boris в этом сообщении не поднимал "
                "и которую закрыл. Убери — отвечай только на заданное, не притягивай от себя."
            )}))
            sys.exit(0)

    # 2) непрошенная приписка-предложение
    if SUGGEST_RE.search(clean) and not REQUEST_RE.search(boris):
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_offtopic_injection: ты приписал непрошенные «шаги/"
            "рекомендации/что ещё сделать», а Boris об этом не просил (в его сообщении "
            "нет запроса на план/варианты/next). Rule 0. Убери приписку — ответь строго "
            "на заданный вопрос."
        )}))
        sys.exit(0)


if __name__ == "__main__":
    main()
