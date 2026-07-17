"""Stop hook — найденную ЛОЖЬ/фейк в сгенерированной статье надо ЧИНИТЬ В КОРНЕ
(маркетинг-бот: KB / SYSTEM_PROMPT), а не только репортить Boris.

Класс ошибки (2026-07-17): я нашел в статье бота выдуманные цены конкурентов и
«бесплатный разбор», отчитался Boris и предложил «скажи — починю флоу». Boris:
каждый найденный фрагмент лжи — САМ ищешь причину и фиксишь в маркет-боте (в KB
или где), автоматом, без спрашивания.

Правило: если в ответе я констатирую ложь/фейк/выдумку/устаревшие данные в статье
(сгенерированном тексте) — в ЭТОМ ЖЕ ходу обязан быть Edit/Write файла маркетинг-
бота (knowledge_base_vibecraft.md / blog_writer.py / bot.py / vela-marketing-bot).
Нет правки корня в боте → блок. Fail-open при ошибке.
"""
import json
import re
import sys
from pathlib import Path

LIE_RE = re.compile(
    r"(вранье|врань[её]|\bфейк|выдум\w+|\bневерно\b|устарел\w*|\bложь\b|отсебятин\w*|"
    r"не\s+подтвержд\w*|фактическ\w+\s+ошибк|галлюцин\w*|приврал|высосан)",
    re.IGNORECASE | re.UNICODE)

CTX_RE = re.compile(
    r"(стать\w+|\bкопи\b|сгенер\w+|\bбот\b|\bтекст\w*|\bpr\s*#?\d|цен\w+\s+конкурент|"
    r"zoho|inflow|cin7|разбор|kb\b|knowledge)",
    re.IGNORECASE | re.UNICODE)

META_RE = re.compile(
    r"(\bхук\b|check_no_lie|класс\s+ошибк|блокир\w*|\bловит\b|правил\w*\s+запрещ)",
    re.IGNORECASE | re.UNICODE)


def _is_tool_result(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


def _turn_slice(msgs):
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            last_human = i
    return msgs[last_human + 1:]


def _last_response_text(turn):
    parts = []
    for m in turn:
        if m.get("type") != "assistant":
            continue
        c = m.get("message", {}).get("content", [])
        if isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "text":
                    parts.append(b.get("text", ""))
    return "\n".join(parts)


def _bot_edited_in_turn(turn):
    for m in turn:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") in ("Edit", "Write", "MultiEdit")):
                fp = str((b.get("input", {}) or {}).get("file_path", ""))
                if "vela-marketing-bot" in fp.replace("\\", "/"):
                    return True
    return False


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
    turn = _turn_slice(msgs)
    resp = _last_response_text(turn)
    if not resp.strip():
        sys.exit(0)
    clean = re.sub(r"```[\s\S]*?```", "", resp)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    if not (LIE_RE.search(clean) and CTX_RE.search(clean)):
        sys.exit(0)
    if META_RE.search(clean):
        sys.exit(0)
    if _bot_edited_in_turn(turn):
        sys.exit(0)  # корень в боте починен в этом ходу — ок
    print(json.dumps({"decision": "block", "reason": (
        "НАРУШЕНИЕ check_no_lie_report_without_fix: ты констатируешь ложь/фейк/выдумку "
        "в статье, но НЕ починил корень в маркетинг-боте в этом ходу. Boris: каждый "
        "найденный фрагмент лжи — САМ ищешь причину и фиксишь в боте (KB / SYSTEM_PROMPT "
        "в knowledge_base_vibecraft.md или blog_writer.py), автоматом, без спрашивания. "
        "СЕЙЧАС: найди, из-за чего бот это сгенерил, и внеси Edit в файл бота, чтобы "
        "следующие статьи не врали. Только репорт без правки корня запрещен."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()
