"""Stop hook — блокирует ответ, который ЦЕЛИКОМ сводится к пустому статусу.

Прямой запрет Boris (09.07): нельзя заполнять пустоту пустыми словами
(«задачи нет», «молчу», «стою», «жду», «нечего добавить»). check_no_filler
ловит слова-открывашки (тут/ок/понял/ясно), но НЕ ловил эти статус-пустышки —
дыра, из-за которой я ими затыкал каждый ход без задачи.

Механизм: нормализуем ответ (без кода/пунктуации), вырезаем все пустые
статус-фразы и связки. Если после этого не осталось СОДЕРЖАНИЯ — ответ пустой,
блок. Если есть хоть что-то по существу — пропускаем.

stop_hook_active-guard оставлен: повторный прогон не блокирует (нет вечного цикла).
"""
import json
import re
import sys
from pathlib import Path

# Пустые статус-фразы (в нормализованном виде: lower, без пунктуации, один пробел).
HOLLOW = [
    "открытых задач больше нет",
    "открытых задач нет",
    "задачи нет",
    "нет задачи",
    "задач нет",
    "нет задач",
    "нет открытых задач",
    "скажешь что делать сделаю",
    "скажешь что делать",
    "скажешь сделаю",
    "жду задачу",
    "жду задачи",
    "жду команду",
    "жду команды",
    "нечего добавить",
    "нечего сказать",
    "как скажешь",
    "молчу",
    "стою",
    "жду",
]


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


def _reduces_to_empty(resp: str) -> bool:
    # Код = содержание, не пустышка.
    text = re.sub(r"```[\s\S]*?```", " CODE ", resp)
    text = re.sub(r"`[^`]*`", " CODE ", text)
    norm = text.lower()
    norm = re.sub(r"[.,!?:;…—\-«»\"'()\[\]*]", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    if not norm:
        return True
    # срезаем вставки-филлеры, из-за которых «задачи В СООБЩЕНИИ нет» или
    # «жду РЕАЛЬНУЮ задачу» не совпадали с базовой пустышкой.
    norm = re.sub(
        r"\b(в\s+этом\s+сообщени\w*|в\s+тво[её]м\s+сообщени\w*|в\s+сообщени\w*|"
        r"тут|здесь|пока\s+что|пока|сейчас|сегодня|больше|уже|"
        r"никаки\w*|каки\w*|какой\W*то|реальн\w*|новы\w*|конкретн\w*|"
        r"настоящ\w*|твою|твоей|твоих|мне)\b",
        " ",
        norm,
    )
    norm = re.sub(r"\s+", " ", norm).strip()
    # вырезаем пустые статус-фразы (сначала длинные)
    for ph in HOLLOW:
        norm = re.sub(rf"(?<!\w){re.escape(ph)}(?!\w)", " ", norm)
    # вырезаем связки/междометия/мат-филлеры, которые сами по себе смысла не несут
    norm = re.sub(
        r"\b(и|а|ну|же|вот|так|там|тут|бля|блять|сука|нахуй|пиздец|ок|окей)\b",
        " ",
        norm,
    )
    norm = re.sub(r"\s+", "", norm)
    return norm == ""


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
    if _reduces_to_empty(resp):
        reason = (
            "НАРУШЕНИЕ check_no_empty_status: ответ целиком сводится к пустому "
            "статусу («задачи нет / молчу / стою / жду / нечего добавить»). Boris "
            "прямо запретил заполнять пустоту пустыми словами. Если реально нет "
            "задачи — не отправляй хвостовую пустышку: либо ответь по существу "
            "последней темы/вопроса, либо выполни ожидающее действие. Пустой статус "
            "в чат не идёт."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
