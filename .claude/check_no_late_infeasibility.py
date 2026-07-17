"""Stop hook — ловит ПОСТФАКТУМ-признание провальности инструмента/подхода.

Класс ошибки (12.07): я берусь за задачу (премиум-тамбнейл через FLUX), гоняю
итерации, жгу время, деньги и внимание Boris — и только ПОСЛЕ провала признаю, что
инструмент заведомо не тянет нужный уровень. Boris: ограничение/провальность надо
озвучивать ДО того как браться (upfront), а не постфактум после трат.

Логика: если в финальном ответе есть признание неспособности инструмента/подхода
(«этим инструментом не вытяну / предел модели / нужен другой инструмент / автоген не
даёт / потолок подхода»), И нет upfront-предупреждения («сразу говорю / предупреждаю
заранее / до начала / может не выйти премиум») — блок: это надо было сказать ДО работы.
"""
import json
import re
import sys
from pathlib import Path

INFEASIBLE = re.compile(
    r"(не\s+вытян\w*\s+(?:этим\s+)?инструмент|этим\s+инструментом\s+[^.\n]{0,40}\bне\b|"
    r"(?:предел|потолок)\s+(?:модели|подхода|инструмента|flux|автоген\w*)|"
    r"ограничени\w*\s+(?:модели|инструмента|flux|подхода)|"
    r"автоген\w*\s+[^.\n]{0,30}\bне\s+(?:да[её]т|тянет|вытян\w*)|"
    r"нужен\s+другой\s+инструмент|нужен\s+дизайнер|не\s+через\s+этот\s+(?:модул\w*|автоген\w*|инструмент)|"
    r"не\s+сделать\s+(?:этим|через\s+этот)|врать\s+не\s+буду\s+что\s+вытян\w*|"
    r"крутить\s+дальше\s*=\s*жечь|заведомо\s+провальн\w*|топ-?премиум\s+[^.\n]{0,20}не\s+(?:да[её]т|тянет))",
    re.IGNORECASE | re.UNICODE,
)
UPFRONT = re.compile(
    r"(сразу\s+(?:говорю|предупре\w*|скажу|оговор\w*)|предупре\w*\s+(?:заранее|сразу|до)|"
    r"до\s+того\s+как\s+бра\w*|до\s+начала|заранее\s+говорю|прежде\s+чем\s+бра\w*|"
    r"может\s+не\s+вы\w*\s+премиум|риск\s+заранее|честно\s+сразу|оговорка\s+до)",
    re.IGNORECASE | re.UNICODE,
)


def _is_tr(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


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
            pass
    last = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tr(m):
            last = i
    resp = []
    for m in msgs[last + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if isinstance(b, dict) and b.get("type") == "text":
                resp.append(b.get("text", ""))
    text = "\n".join(resp)
    clean = "\n".join(l for l in text.splitlines() if not l.lstrip().startswith(">"))
    if not INFEASIBLE.search(clean):
        sys.exit(0)
    if UPFRONT.search(clean):
        sys.exit(0)   # предупредил upfront — законно
    print(json.dumps({"decision": "block", "reason": (
        "НАРУШЕНИЕ check_no_late_infeasibility: ты ПОСТФАКТУМ признаёшь, что инструмент "
        "или подход заведомо не тянет нужный уровень — уже потратив время, деньги и "
        "внимание Boris на итерации. Это надо было озвучить ДО того как браться: оценить, "
        "даёт ли инструмент нужное качество, и предупредить upfront. СТОП: если задача этим "
        "инструментом заведомо не даёт результата — говори это СРАЗУ, до трат. Сейчас честно "
        "оговори, что предупреждение запоздало, и дай выполнимый путь, а не оправдание постфактум."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()
