"""Stop hook — ЗАПРЕТ лезть к Boris с предложениями «что-то сделать» вместо выдачи
результата.

Класс ошибки (2026-07-17): после аудита я заканчивал «скажи слово — правлю статью
и/или чиню флоу», «жду команду: X или Y», «могу поправить». Boris: не лезь каждый
раз с тупыми предложениями че-то сделать — просто выдай запрошенное (корректуру,
ответ, результат), без офферов и развилок «делать или нет».

Правило: не заканчивать ответ оффером сделать работу или развилкой-разрешением
(«скажи — сделаю», «могу X», «хочешь я», «жду команду», «правлю X или сначала Y»).
Выдал запрошенное — и всё. Исключение: Boris сам попросил варианты/предложения.

Логика: в ответе есть оффер-сделать/развилка-разрешение И Boris в последнем
сообщении НЕ просил варианты → блок. Fail-open при ошибке.
"""
import json
import re
import sys
from pathlib import Path

PROPOSAL_RE = re.compile(
    r"(скаж(?:и|ешь)\s*[—–,-]*\s*(?:и\s+)?(?:я\s+)?(?:правлю|сделаю|починю|поправлю|"
    r"внедрю|запушу|добавлю|доработаю|дам)|"
    r"жду\s+(?:команд|слов|отмашк|твоего\s+слова|указани|решени)|"
    r"могу\s+(?:сделать|поправить|починить|внедрить|запушить|доработать|добавить|править)|"
    r"хочешь\s*[,]?\s*(?:я\b|сделаю|поправлю|починю|внедрю|чтобы\s+я)|"
    r"готов\s+(?:сделать|поправить|починить|внедрить|запушить|доработать)|"
    r"давай\s+(?:я\s+)?(?:сделаю|поправлю|починю|запушу|внедрю)|"
    r"предлага\w+\s+(?:сделать|поправить|починить|внедрить|доработать|вариант)|"
    r"(?:правлю|чиню|делаю|фиксю|поправлю)\s+.{0,50}?\s+или\s+(?:сначала|только|снач|потом)|"
    r"или\s+(?:сначала|только)\s+[^.?!]{0,40}\?)",
    re.IGNORECASE | re.UNICODE)

# Boris сам попросил варианты/предложения — тогда оффер уместен, не блокируем.
ASKED_RE = re.compile(
    r"(предложи|какие\s+вариант|что\s+делать|дай\s+вариант|как\s+лучше|"
    r"вариант\w*\??|что\s+можно\s+сделать|посоветуй|что\s+дальше|твои\s+предложени)",
    re.IGNORECASE | re.UNICODE)

META_RE = re.compile(
    r"(хук|check_no_work_proposal|класс\s+ошибк|блокир\w*|\bловит\b|оффер-сдела)",
    re.IGNORECASE | re.UNICODE)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "Stop hook feedback", "НАРУШЕНИЕ check", "system-reminder",
)


def _is_tool_result(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


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


def _last_boris(msgs):
    for m in reversed(msgs):
        if m.get("type") != "user" or m.get("isMeta") or _is_tool_result(m):
            continue
        c = m.get("message", {}).get("content", "")
        t = c if isinstance(c, str) else " ".join(
            b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
        if not t.strip() or any(mk in t for mk in SERVICE_MARKERS):
            continue
        return t
    return ""


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
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    m = PROPOSAL_RE.search(clean)
    if not m:
        sys.exit(0)
    if META_RE.search(clean):
        sys.exit(0)
    if ASKED_RE.search(_last_boris(msgs)):
        sys.exit(0)  # Boris сам попросил варианты
    print(json.dumps({"decision": "block", "reason": (
        f"НАРУШЕНИЕ check_no_work_proposal: ты лезешь к Boris с предложением сделать "
        f"работу («{m.group(0).strip()[:60]}») вместо того, чтобы просто выдать "
        "запрошенное. Boris запретил каждый раз соваться с офферами «сделать или нет» "
        "и развилками «делаю X или Y — скажи». Убери оффер/развилку: выдай результат "
        "(корректуру/ответ/готовый вариант) и всё. Хочет продолжения — сам скажет."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()
