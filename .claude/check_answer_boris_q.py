"""Stop hook — НАПОМИНАНИЕ ответить на ВОПРОСЫ Boris, а не только сделать действия.

Класс ошибки (14.07): Boris задаёт прямой вопрос («можешь настроить файл или нет?»,
«что делать с 55 темами?»), а я вместо ответа молча делаю Edit/Bash — вопрос повисает
без ответа, Boris в ярости «проебал два указания». Хук ловит вопросы в последних
mid-turn репликах Boris и напоминает ответить на КАЖДЫЙ явно. Round-limit — чтобы
напомнить один раз и не зациклить.
"""
import json
import re
import sys
from pathlib import Path

STATE = Path(__file__).with_name(".answer_q_count")
MAX = 1

Q_MARKERS = re.compile(
    r"(можешь|можно ли|или нет|что делать|что теперь|что со|как\b|почему|зачем|"
    r"какой|каком|где\b|нужно ли|стоит ли|будешь|сделаешь|верно ли|это как)",
    re.IGNORECASE | re.UNICODE,
)
# ИМПЕРАТИВЫ-требования БЕЗ «?» — Boris часто требует без знака вопроса:
# «где текст драфта», «чини баг», «дай», «покажи», «жду». Их тоже нельзя игнорить.
DEMAND_RE = re.compile(
    r"(\bгде\b|\bдай\b|покажи|выдай|скинь|пришли|\bчини\b|почини|исправь|"
    r"\bжду\b|ответь|отвеч|не игнор|где текст|где драфт|где ответ)",
    re.IGNORECASE | re.UNICODE,
)


def _rounds() -> int:
    try:
        return int(STATE.read_text().strip() or "0")
    except Exception:
        return 0


def _set(n: int):
    try:
        STATE.write_text(str(n))
    except Exception:
        pass


def _is_tool_result(m: dict) -> bool:
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def main():
    try:
        p = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if p.get("stop_hook_active") and _rounds() >= MAX:
        _set(0)
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
    # user-реплики ПОСЛЕ последнего содержательного assistant-текста (пачка mid-turn)
    last_asst = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "assistant":
            c = m.get("message", {}).get("content", [])
            if isinstance(c, list) and any(
                isinstance(b, dict) and b.get("type") == "text" and b.get("text", "").strip()
                for b in c
            ):
                last_asst = i
    user_texts = []
    for m in msgs[last_asst + 1:]:
        if m.get("type") == "user" and not _is_tool_result(m):
            c = m.get("message", {}).get("content", [])
            if isinstance(c, str):
                user_texts.append(c)
            elif isinstance(c, list):
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "text":
                        user_texts.append(b.get("text", ""))
                    elif isinstance(b, str):
                        user_texts.append(b)
    blob = "\n".join(user_texts)
    # сегменты по строкам и предложениям — ловим и вопросы («?» + маркер),
    # и императивы-требования (где/дай/покажи/чини/жду) даже без «?».
    segments = [s.strip() for s in re.split(r"[\n]+|(?<=[.!?])\s+", blob) if s.strip()]
    questions = []
    for seg in segments:
        if ("?" in seg and Q_MARKERS.search(seg)) or DEMAND_RE.search(seg):
            questions.append(seg)
    if not questions:
        _set(0)
        sys.exit(0)
    qlist = " | ".join(q[:70] for q in questions[:4])
    msg = (
        "НАПОМИНАНИЕ check_answer_boris_q: Boris задал вопрос(ы)/требование(я) — [" + qlist + "]. "
        "ЗАПРЕЩЕНО молча делать действия и игнорить их. Ответь на КАЖДЫЙ вопрос/требование ЯВНО "
        "(да/нет/вот текст/что делаешь) прямо в тексте ответа, и только потом/параллельно действия. "
        "Перечитай ВСЕ его mid-turn реплики выше и убедись, что ни один вопрос и ни одно "
        "требование (где текст / дай / покажи / чини) не повисли без ответа."
    )
    _set(_rounds() + 1)
    print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
