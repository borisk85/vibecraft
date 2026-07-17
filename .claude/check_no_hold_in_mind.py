"""Stop hook — блокирует обещания «держать в уме / иметь в виду / не забыть»,
когда я НЕ зафиксировал это в файл в том же ходу.

Класс ошибки (10.07): нашёл реальную задачу (erid-маркировка Travelpayouts в
flights.py) и сказал «держим в уме» вместо записи. При ресете контекст теряется
→ обещание = ложь. Boris в ярости: «ты также забудешь», «почему отсебятину про
держать в уме несёшь». Памяти между сессиями у меня нет — любое «в уме» = наёб.

Правило: реальную задачу/находку/договорённость СРАЗУ фиксировать в репо
(BACKLOG.md, docs/, или память). Обещать «запомнить/иметь в виду» без записи в
файл — запрещено. Если в ответе есть фраза-обещание-помнить И в этом ходу не было
Write/Edit — блок.
"""
import json
import re
import sys
from pathlib import Path

HOLD_RE = re.compile(
    r"(держ\w*\s+(?:в\s+)?(?:уме|голове|памяти|виду)|"
    r"имет[ья]\s+в\s+виду|име[йя]\s+в\s+виду|учт[её]м\s+на\s+будущ|"
    r"не\s+забуд\w+|не\s+забыть|запомн\w+\s+(?:на\s+будущ|про|что)|"
    r"на\s+будущее\s+держ|держим\s+в\b|пометим\s+себе|"
    r"буду\s+помнить|запишу\s+в\s+голове)",
    re.IGNORECASE | re.UNICODE,
)
PERSIST_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}


def _is_tr(msg):
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


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
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tr(m):
            last_human = i
    resp, tools = [], set()
    for m in msgs[last_human + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if not isinstance(b, dict):
                continue
            if b.get("type") == "text":
                resp.append(b.get("text", ""))
            elif b.get("type") == "tool_use":
                tools.add(b.get("name", ""))
    text = "\n".join(resp)
    if not text.strip():
        sys.exit(0)
    clean = re.sub(r"```[\s\S]*?```", "", text)
    if HOLD_RE.search(clean) and not (tools & PERSIST_TOOLS):
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_hold_in_mind: ты обещаешь «держать в уме / иметь в виду / "
            "не забыть», но НЕ записал это в файл в этом ходу. Памяти между сессиями у "
            "тебя НЕТ — обещание = наёб, при ресете забудешь. СТОП: зафиксируй задачу/"
            "находку в репо (docs/BACKLOG.md, docs/, или память) реальным Write/Edit, "
            "потом отчитайся. Не обещай помнить — записывай."
        )}))
        sys.exit(0)


if __name__ == "__main__":
    main()
