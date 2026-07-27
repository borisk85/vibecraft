"""PreToolUse hook — блокирует вставку ВЫДУМАННОЙ критической копи в services-pages.ts.

Правило (rule 0 + vibecraft/CLAUDE.md): критическое описание страницы (heroIntro,
geoAnswer, forWhom, seoDescription, h1, seoTitle) — ТОЛЬКО из подтверждённых Boris'ом
фактов/текста или repo-источника. НЕ сочинять от себя.

Механизм: правка длинной русской копи в services-pages.ts блокируется, ЕСЛИ в
последних сообщениях Boris нет явного одобрения вставки (вставляй/вставь/впиши/бери
этот) и новый текст не пришёл от самого Boris (нет заметного пересечения). Заставляет
сначала показать черновик с источником и получить ОК.
"""
import json
import re
import sys


APPROVE_RE = re.compile(
    r"(вставля\w*|\bвставь\b|вставить|впиши\w*|бери\s+этот|используй\s+этот|"
    r"вот\s+(?:текст|сабт|копи|описани)|этот\s+текст|одобр\w*|апрув\w*)",
    # ВНИМАНИЕ: «напиши/перепиши/ресёрч/для кого» СПЕЦИАЛЬНО не разрешают вставку —
    # это команда написать, но не карт-бланш на выдумку. Пиши черновик в чат с
    # источниками, дождись явного «вставляй», и только тогда правь код.
    re.IGNORECASE | re.UNICODE,
)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
)


def _cyr_len(s: str) -> int:
    return len(re.findall(r"[а-яёА-ЯЁ]", s))


def _recent_boris(lines, n=4):
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
            text = " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S).strip()
        if not text or any(m in text for m in SERVICE_MARKERS):
            continue
        out.append(text)
        if len(out) >= n:
            break
    return out


def _overlaps(new_text, boris_msgs):
    """True, если заметный кусок new_text есть в сообщениях Boris (он дал текст)."""
    joined = " ".join(boris_msgs)
    # ищем совпадение фразы 30+ символов
    words = new_text.split()
    for i in range(0, max(1, len(words) - 5)):
        chunk = " ".join(words[i:i + 6])
        if len(chunk) >= 30 and chunk in joined:
            return True
    return False


def decide():
    try:
        data = json.loads(sys.stdin.read() or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if not fp.endswith("lib/services-pages.ts"):
        return None
    new_text = str(ti.get("new_string", "") or ti.get("content", ""))
    # только длинная русская проза = копи-поле (не мелкие правки терминов/чисел)
    if _cyr_len(new_text) < 80:
        return None
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    boris = _recent_boris(lines)
    if not boris:
        return None
    joined = " ".join(boris)
    if APPROVE_RE.search(joined) or _overlaps(new_text, boris):
        return None  # Boris одобрил вставку или дал текст
    return (
        "БЛОК check_no_invented_copy: правка критического описания страницы "
        "(services-pages.ts). Правило rule 0 + CLAUDE.md: копи ТОЛЬКО из "
        "подтверждённого Boris'ом текста/фактов, НЕ от себя. В последних сообщениях "
        "Boris нет явного «вставляй/вставь» и текст не от него. СТОП: покажи черновик "
        "в чате С ИСТОЧНИКОМ каждого утверждения, дождись явного ОК/«вставляй», и "
        "только тогда повтори правку."
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
