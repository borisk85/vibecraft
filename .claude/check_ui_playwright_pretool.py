"""PreToolUse (Edit/Write) — не трогать ВИЗУАЛ вслепую, без реального взгляда на страницу.

Путь A (14.07): добавил 4-ю карточку в сетку из 3, не посмотрев как ляжет в grid-cols-3;
кривая верстка уехала в прод. Гейтим .tsx-правки структуры раскладки.

Путь B (17.07): жалоба была ВИЗУАЛЬНАЯ («на экране 2 CTA-кнопки»), я правил файл, не
открыв страницу → промах.

ВАЖНО (18.07): раньше оба пути снимались ТЕКСТОВОЙ пометкой «визуал: …» в ответе. Boris
запретил эту строку в ответах навсегда — она была отмазкой-костылём. Убрано: теперь
единственный способ пройти — РЕАЛЬНО посмотреть страницу через Playwright (browser_*
tool). Никаких текстовых пометок. Правки самих хуков (.claude/) не гейтим.
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

VISUAL_COMPLAINT_RE = re.compile(
    r"(на\s+экране|ховер|hover|навед|"
    r"кавер|обложк|иконк|звезд|бейдж|badge|плашк|лого|"
    r"дубл\w*\s*(кнопк|cta|ста|блок|слов|бренд|заголов|текст|элемент|иконк)|"
    r"(две|двойн\w*|2)\s*(кнопк|cta|ста|блок)|"
    r"кнопк\w*.{0,14}(одинак|дубл|повтор|дважды|два\s+раза)|"
    r"одинаков\w*.{0,14}(кнопк|cta|ста|блок)|"
    r"съехал|уехал|наезжа|перекрыва|не\s+влезае|тоньше|толще|"
    r"выглядит|отобража|в\s+разных\s+местах|выкрас|покрас|цвет\w*\s+(лин",
    re.IGNORECASE | re.UNICODE,
)


def _has_playwright_look(o):
    if not isinstance(o, dict) or o.get("type") != "assistant":
        return False
    content = (o.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return False
    for b in content:
        if (isinstance(b, dict) and b.get("type") == "tool_use"
                and "browser_" in str(b.get("name", ""))):
            return True
    return False


def _user_speech(o):
    if not isinstance(o, dict) or o.get("type") != "user":
        return ""
    content = (o.get("message", {}) or {}).get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for b in content:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "tool_result":
                return ""
            if b.get("type") == "text":
                parts.append(b.get("text", ""))
        return "\n".join(parts)
    return ""


def _visual_complaint_unlooked(objs):
    last_look = -1
    for i, o in enumerate(objs):
        if _has_playwright_look(o):
            last_look = i
    for i in range(last_look + 1, len(objs)):
        txt = _user_speech(objs[i])
        if txt and VISUAL_COMPLAINT_RE.search(txt):
            return True
    return False


def _recent_browser_look(objs):
    for o in objs[-250:]:
        if _has_playwright_look(o):
            return True
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
    payload = (str(ti.get("new_string", "")) + "\n"
               + str(ti.get("old_string", "")) + "\n"
               + str(ti.get("content", "")))

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []

    # Путь B: неразобранная визуальная жалоба + не смотрел страницу с тех пор.
    if objs and _visual_complaint_unlooked(objs):
        return (
            "БЛОК check_ui_visual: последняя жалоба Boris — про то, что ВИДНО на странице "
            "(кнопка/дубль/ховер/кавер/иконка/цвет/линия/верстка), а ты правишь файл, НЕ "
            "открыв саму страницу. СТОП: сначала реально ПОСМОТРИ через Playwright "
            "(browser_navigate + browser_take_screenshot/snapshot/evaluate), найди источник "
            "того, что видит Boris, и только потом правь. Текстовой пометкой это больше НЕ "
            "снимается — нужен настоящий заход в браузер."
        )

    # Путь A: структурная правка .tsx без реального взгляда на верстку.
    if fp.lower().endswith(".tsx") and STRUCT_RE.search(payload):
        if not _recent_browser_look(objs):
            return (
                "БЛОК check_ui_playwright: правится СТРУКТУРА верстки (.tsx, сетка/карточки/"
                "колонки), а ты не посмотрел как ляжет. Открой страницу через Playwright "
                "(browser_navigate + browser_take_screenshot) и правь по факту. Текстовой "
                "пометкой не снимается — нужен реальный заход в браузер."
            )
    return None


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
