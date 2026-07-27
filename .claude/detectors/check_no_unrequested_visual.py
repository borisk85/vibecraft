"""PreToolUse (Edit/Write) — ЗАПРЕТ добавлять ВИЗУАЛ/цвет/стиль, которого Boris не просил.

Класс ошибки (18.07): я выкрасил названия путей в таблице в фиолетовый, сделал цветную
шапку и жирную линию — Boris этого не просил. «Кто тебе сказал выкрасить эту часть?!»
Отсебятина в дизайне жрала часы и бесила. Boris: не делать ВООБЩЕ ничего непрошенного.

Правило: правка visual-файла (globals.css, components/*.tsx, app/**), которая ДОБАВЛЯЕТ
цвет/градиент/акцент/новый визуальный стиль, — только если в недавних репликах Boris есть
явный запрос на стиль/цвет/визуал (цвет/выкрас/обыграй/стиль/шапка/линия/жирный/фон/рамка/
иконка/кавер/отступ/шрифт/тоньше/толще/дизайн/визуал/выглядит). Нет запроса → отсебятина
→ блок. Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

# Правка ДОБАВЛЯЕТ цвет/акцент/градиент/визуальный стиль.
STYLE_ADD_RE = re.compile(
    r"rgb\(|#[0-9a-fA-F]{3,6}\b|gradient|--color-accent|accent-text|"
    r"bg-gradient|text-accent|border-.{0,10}accent|box-shadow|"
    r"font-weight\s*:\s*[6-9]|\bfont-bold\b|\*\*[^*]+\*\*",
    re.IGNORECASE)

# Boris явно просил про стиль/цвет/визуал.
STYLE_REQUEST_RE = re.compile(
    r"цвет|выкрас|покрас|обыгр|стил[ья]|шапк|лини|тоньше|толще|жирн|болд|"
    r"фон|рамк|иконк|кавер|обложк|отступ|шрифт|визуал|выглядит|дизайн|"
    r"градиент|акцент|бейдж|плашк|подсвет|оформ",
    re.IGNORECASE | re.UNICODE)

_SVC = ("НАРУШЕНИЕ", "БЛОК check", "check_", "Stop hook feedback", "hook additional",
        "system-reminder", "tool_use_error", "hookSpecificOutput",
        "This is how Claude Code surfaces", "Жесткие правила")


def _visual_target(fp):
    fpl = fp.lower().replace("\\", "/")
    if fpl.endswith("globals.css"):
        return True
    if "/components/" in fpl and fpl.endswith(".tsx"):
        return True
    if "/app/" in fpl and fpl.endswith(".tsx"):
        return True
    return False


def _recent_boris_style_request(objs, n=9):
    """True, если в последних n репликах Boris есть запрос на стиль/цвет/визуал."""
    seen = 0
    for o in reversed(objs):
        if not isinstance(o, dict) or o.get("type") != "user":
            continue
        content = (o.get("message", {}) or {}).get("content")
        text = ""
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            if content and all(isinstance(b, dict) and b.get("type") == "tool_result"
                               for b in content):
                continue
            text = " ".join(b.get("text", "") for b in content
                            if isinstance(b, dict) and b.get("type") == "text")
        text = text.strip()
        if not text or any(m in text for m in _SVC):
            continue
        seen += 1
        if STYLE_REQUEST_RE.search(text):
            return True
        if seen >= n:
            break
    return False


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
    if not _visual_target(fp):
        return None
    payload = str(ti.get("new_string", "")) + "\n" + str(ti.get("content", ""))
    if not STYLE_ADD_RE.search(payload):
        return None

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if _recent_boris_style_request(objs):
        return None  # Boris просил стиль/цвет — можно

    hit = STYLE_ADD_RE.search(payload).group(0)
    return (
        f"БЛОК check_no_unrequested_visual: ты ДОБАВЛЯЕШЬ визуал/цвет/стиль («{hit.strip()}»), "
        "а Boris в недавних репликах об этом НЕ просил. Класс ошибки 18.07: выкрасил "
        "названия в таблице, сделал цветную шапку/линию без спроса — «кто сказал выкрасить?!». "
        "Не делай непрошенного. Либо это реально просили (тогда должно быть слово про "
        "стиль/цвет/визуал в его сообщении), либо НЕ добавляй — делай ровно то, что сказано."
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
