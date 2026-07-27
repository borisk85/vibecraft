"""Stop hook — АНТИ-ДУБЛЬ: запрещает повторять в чате то, что уже сказано.

Класс ошибки (Boris в ярости 10.07): на его короткие реплики/оскорбления я раз за
разом слал почти один и тот же статус («PR51 удалён», «предохранитель поставлен»,
«ошибка моя из головы») — по 5 раз. Старый порог MIN_LEN=220 короткие статусы
пропускал, и повтор смысла между ходами не ловился.

Два детектора:
1) NEAR-DUPLICATE — финальная реплика почти дословно повторяет недавнюю (Жаккар).
2) NOTHING-NEW — почти все значимые слова финалки уже были в недавних репликах
   (containment): ответ ничего не добавляет, это перепев уже сказанного.

Окно — последние реплики по ВСЕМУ транскрипту (Boris пишет mid-turn, дробит ход).
"""
import json
import re
import sys
from pathlib import Path

WINDOW = 10            # чуть шире исходного (Boris дробит ход), но не 12 — 12 давало ложные на тех. ответы одной темы (13.07)
NEAR_MIN_LEN = 80      # near-duplicate меряем и на средних репликах, не только длинных
NEAR_JACCARD = 0.45    # порог near-duplicate
CONTAIN_MIN_SIG = 4    # минимум значимых слов в финалке для containment-проверки
CONTAIN_RATIO = 0.62   # доля основ финалки, уже сказанных ранее → перепев (перефраз ловится стеммингом)


def _is_tool_result_message(msg: dict) -> bool:
    content = msg.get("message", {}).get("content", [])
    if not isinstance(content, list) or not content:
        return False
    return all(isinstance(b, dict) and b.get("type") == "tool_result" for b in content)


def _replies(transcript_path: str):
    p = Path(transcript_path)
    if not p.exists():
        return []
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    out = []
    for msg in messages:
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        txt = " ".join(
            b.get("text", "") for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        ).strip()
        if txt:
            out.append(txt)
    return out[-WINDOW:]


def _sig(text: str):
    # значимые слова: 4+ символов, обрезаем до ОСНОВЫ (6 симв), чтобы ловить перефраз
    # словоформами: «кликабельны/кликабельным/кликабельно» → одна основа «кликаб».
    # Это и есть дыра, из-за которой перепев с другими окончаниями проходил (13.07).
    clean = re.sub(r"```[\s\S]*?```", "", text)
    return {w[:6] for w in re.findall(r"[a-zа-яё0-9]{4,}", clean.lower())}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


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
    replies = _replies(tp)
    if len(replies) < 2:
        sys.exit(0)
    final = replies[-1]
    fw = _sig(final)
    if not fw:
        sys.exit(0)

    prior_all = set()
    for prev in replies[:-1]:
        pw = _sig(prev)
        prior_all |= pw
        # 1) near-duplicate (обе реплики не микро)
        if len(final) >= NEAR_MIN_LEN and len(prev) >= NEAR_MIN_LEN:
            if _jaccard(fw, pw) >= NEAR_JACCARD:
                print(json.dumps({"decision": "block", "reason": (
                    "НАРУШЕНИЕ check_no_chat_duplicate: финальная реплика почти повторяет "
                    "недавнюю — дубль в чате, Boris бесит. НЕ перепечатывай. Дай только "
                    "короткую дельту (что нового), либо, если добавить нечего, не отправляй "
                    "повтор вовсе."
                )}))
                sys.exit(0)

    # 3) CORE-REPEAT «жую одну тему»: ядро специфичных слов (длиной 6+, обрезанных до
    # основы) повторяется в двух моих ответах подряд — даже если детали разные и
    # containment низкий. Ловит перепев-с-вариациями (claude/телеграм/интент по кругу),
    # который лексический jaccard/containment пропускает (13-14.07). Даёт часть ложных.
    def _spec(t: str):
        clean_t = re.sub(r"```[\s\S]*?```", "", t)
        return {w[:6] for w in re.findall(r"[a-zа-яё0-9]{6,}", clean_t.lower())}
    spec_f = _spec(final)
    if len(spec_f) >= 5:
        for prev in replies[:-1]:
            if len(spec_f & _spec(prev)) >= 5:
                print(json.dumps({"decision": "block", "reason": (
                    "НАРУШЕНИЕ check_no_chat_duplicate (core-repeat): ты ЖУЁШЬ одну и ту же "
                    "тему — ядро специфичных слов повторяется в твоих ответах подряд, хоть "
                    "детали и разные. Boris запретил гонять одно по кругу. НЕ пиши очередной "
                    "перепев про то же: дай ТОЛЬКО новую суть по последней реплике, либо "
                    "короткое действие без пересказа уже сказанного."
                )}))
                sys.exit(0)

    # 2) nothing-new: почти всё из финалки уже сказано ранее.
    # Длинные ответы (отчёты-перепевы «всё в проде», повтор сделанного) ловим строже:
    # 0.55 против 0.68 для коротких дельт. Boris бесит именно длинный повтор отчёта.
    ratio_threshold = 0.52 if len(final) >= 300 else CONTAIN_RATIO
    if len(fw) >= CONTAIN_MIN_SIG:
        contain = len(fw & prior_all) / len(fw)
        if contain >= ratio_threshold:
            print(json.dumps({"decision": "block", "reason": (
                "НАРУШЕНИЕ check_no_chat_duplicate: ответ ничего не добавляет — почти все "
                "его слова уже сказаны в недавних репликах (PR51/предохранитель/признание "
                "ошибки повторяются по кругу). Boris прямо запретил повторять одно и то же. "
                "НЕ отправляй перепев. Либо новое по существу его последней реплики, либо "
                "одна короткая новая мысль — без повтора уже сказанного."
            )}))
            sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
