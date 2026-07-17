"""Stop + PreToolUse hook — ЗАПРЕТ самовольно сворачивать работу и указывать Boris отдыхать.

CLAUDE.md прямо: «НИКОГДА не предлагать закончить сессию», не говорить «на сегодня все»,
«завтра продолжим», «жду». Boris сам решает, когда стоп; я исполняю, не останавливаюсь по
своему усмотрению и не даю ему указаний отойти/отдохнуть/выдохнуть/не спешить.

Класс ошибки (18.07): я написал «Отложи и выдохни… не тороплю… вернешься когда захочешь…
решать тебе» — самовольно предложил прекратить работу И стал указывать Boris, что делать.
Boris: где тебе разрешено самовольно останавливаться и мне указывать? Нигде.

Правило: если в финальной реплике есть предложение остановиться/отложить/сделать паузу
или указание Boris отдохнуть/выдохнуть/отойти/не спешить/вернуться-когда-захочешь — блок.
Убрать полностью, продолжать работу по очереди.
"""
import json
import re
import sys
from pathlib import Path

SUGGEST_STOP_RE = re.compile(
    r"(отлож\w*|"
    r"выдохн\w*|передохн\w*|отдохн\w*|отдых\w*|отойд\w*|отойти|"
    r"не\s+тороп\w*|не\s+буду\s+тороп\w*|торопить\s+не\s+буду|"
    r"верн\w*\s+когда\s+захочешь|когда\s+захочешь\s+верн\w*|возвраща\w*\s+когда\s+захоч|"
    r"ничего\s+не\s+горит|не\s+горит,?\s+можно|"
    r"не\s+ж(?:ги|ечь)\s+[^.\n]{0,20}сил|"
    r"реш(?:ать|ай)\s+тебе\b|как\s+реш(?:ишь|аешь)\b|"
    r"на\s+сегодня\s+(?:все|хватит|достаточно)|завтра\s+продолж|"
    r"можно\s+(?:отлож|остановит|прерват|сделать\s+паузу)|"
    r"сделай\s+паузу|возьми\s+паузу|сделать\s+перерыв)",
    re.IGNORECASE | re.UNICODE,
)


def _final_assistant_text(tp):
    p = Path(tp)
    if not p.exists():
        return ""
    msgs = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            continue
    for m in reversed(msgs):
        if m.get("type") != "assistant":
            continue
        content = m.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if any(t.strip() for t in parts):
            return "\n".join(parts)
    return ""


def _find(text):
    if not text.strip():
        return None
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    quote_spans = [(m.start(), m.end()) for m in re.finditer(r"«[^»]*»", clean)]
    for m in SUGGEST_STOP_RE.finditer(clean):
        if any(qs <= m.start() and m.end() <= qe for qs, qe in quote_spans):
            continue
        return m
    return None


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
    hit = _find(_final_assistant_text(tp))
    if not hit:
        sys.exit(0)
    msg = (
        f"НАРУШЕНИЕ check_no_suggest_stop: запрещенная фраза «{hit.group(0).strip()}». "
        "Ты самовольно сворачиваешь работу или указываешь Boris отдохнуть/отложить/не "
        "спешить/вернуться-когда-захочешь. CLAUDE.md: НИКОГДА не предлагать закончить "
        "сессию, не говорить «жду», не недооценивать. Убери фразу ПОЛНОСТЬЮ и продолжай "
        "работу по очереди — стоп решает только Boris."
    )
    event = payload.get("hook_event_name")
    if event == "PreToolUse":
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": msg,
            }
        }))
    else:
        print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
