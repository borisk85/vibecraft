"""PreToolUse hook - ne menyat SETKU/strukturu UI vslepuyu, bez vizualnoy proverki.

Klass oshibki (14.07): dobavil 4-yu kartochku v massiv advantages (setka iz 3),
ne posmotrev kak lyazhet v grid-cols-3. Kartochka vstala odna v novom ryadu -
krivaya verstka uehala v prod. Boris: zachem lezesh v UI bez playwrighta.

Huk geytit Edit/Write v .tsx, kogda menyaetsya STRUKTURA raskladki. Chtoby proyti -
v podvodke pered instrumentom podtverdit vizual: napisat "vizual: <kak proveril>".
"""
import json
import re
import sys

STRUCT_RE = re.compile(
    r"(grid-cols-|\{\s*icon:|col-span|columns|flex-wrap|min-w-\[|max-w-\[|"
    r"grid-template|<Advantage|advantages:\s*\[|grid-rows|basis-|"
    r"w-\[\d|justify-|items-stretch|aspect-\[|space-y-|gap-)",
    re.IGNORECASE,
)

VISUAL_EXEMPT_RE = re.compile(
    r"(vizual|визуал|playwright|скриншот|browser_|snapshot|"
    r"снапшот|верстк|как\s+ляжет|как\s+льётся|глазами|проверю\s+визуал)",
    re.IGNORECASE | re.UNICODE,
)


def _last_assistant_text(lines):
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if parts:
            return "\n".join(parts)
    return ""


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if "/.claude/" in fp.lower():
        return None
    if not fp.lower().endswith(".tsx"):
        return None
    payload = (str(ti.get("new_string", "")) + "\n"
               + str(ti.get("old_string", "")) + "\n"
               + str(ti.get("content", "")))
    if not STRUCT_RE.search(payload):
        return None
    tp = data.get("transcript_path")
    lead = ""
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                lead = _last_assistant_text(f.read().splitlines())
        except Exception:
            lead = ""
    if VISUAL_EXEMPT_RE.search(lead):
        return None
    return (
        "BLOK check_ui_playwright: pravitsya STRUKTURA verstki (.tsx, setka/kartochki/"
        "kolonki), no v podvodke net pometki vizualnoy proverki. Klass oshibki - 4-ya "
        "kartochka odna v ryadu uehala v prod. ZAPRESHCHENO menyat raskladku vslepuyu. "
        "Snachala posmotri kak lyazhet cherez Playwright (browser_navigate + "
        "browser_take_screenshot) LIBO podtverdi plan: napishi v podvodke "
        "'vizual: <kak proveryu do deploya>' - tolko togda prav. Ne huyar setku na glaz."
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
