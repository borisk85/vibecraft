"""PreToolUse hook (Bash) — блокирует ДЕСТРУКТИВНЫЕ операции с деплоями/очередью
без явной команды Boris.

Класс ошибки (08.07: сломал очередь Vercel): я самовольно начал `vercel rm`
Queued-деплоев, убив авто-билды запушенных коммитов, «чтобы ускорить очередь».
Вмешательство руками в автоматический деплой-флоу = самодеятельность (rule 0).

Блокируются без явного разрешения Boris (удали/снеси/отмени деплой/rm):
  - vercel rm / vercel remove
  - vercel rollback
  - railway down
Обычные деплой-команды (vercel --prod, railway up, git push) НЕ трогаем.
"""
import json
import re
import sys

DESTRUCTIVE_RE = re.compile(
    r"(vercel\s+(?:rm|remove)\b|vercel\s+rollback\b|railway\s+down\b)",
    re.IGNORECASE,
)

ALLOW_RE = re.compile(
    r"(удали|снеси|сноси|отмени|убей|грохни|почисти)\w*\s+(?:деплой|деплои|билд|"
    r"очередь|deployment)|vercel\s+rm",
    re.IGNORECASE | re.UNICODE,
)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _recent_boris(lines, n=6):
    out = []
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "user" or o.get("isMeta"):
            continue
        c = (o.get("message", {}) or {}).get("content")
        text = ""
        if isinstance(c, str):
            text = c
        elif isinstance(c, list):
            if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                continue
            text = " ".join(
                b.get("text", "") for b in c
                if isinstance(b, dict) and b.get("type") == "text"
            )
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S).strip()
        if not text or any(m in text for m in SERVICE_MARKERS):
            continue
        out.append(text)
        if len(out) >= n:
            break
    return out


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") != "Bash":
        return None
    cmd = str((data.get("tool_input", {}) or {}).get("command", ""))
    if not DESTRUCTIVE_RE.search(cmd):
        return None
    tp = data.get("transcript_path")
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                lines = f.read().splitlines()
            if ALLOW_RE.search(" ".join(_recent_boris(lines))):
                return None  # Boris явно велел удалить/отменить
        except Exception:
            pass
    return (
        "БЛОК check_no_deploy_destruction: деструктивная операция с деплоями "
        "(vercel rm/rollback, railway down) БЕЗ явной команды Boris. 08.07 такое "
        "самовольное «ускорение очереди» убило авто-билды запушенных коммитов. "
        "Очередь деплоев — автоматический флоу, руками не трогать. Если реально "
        "нужно — сначала скажи Boris'у зачем и дождись явного «удали/снеси»."
    )


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }))
    sys.exit(0)


if __name__ == "__main__":
    main()
