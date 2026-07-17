"""PreToolUse (Edit/Write globals.css) — ЗАПРЕТ красить новый элемент в цвет, уже
занятый другим элементом (иначе они сливаются).

Класс ошибки (18.07): я покрасил цены в тот же акцентный фиолетовый, что и ссылки
(.blog-content a использует var(--color-accent-text)). Цены слились со ссылками —
Boris: «ссылки и цены одного цвета». Даже после одобрения «цвет» я не сообразил, что
этот цвет УЖЕ занят ссылками.

Правило: правка globals.css, которая задаёт КЛАССУ внутри .blog-content акцентный цвет
(var(--color-accent-text)/--color-accent или #8b5cf6/#ec4899) — блок. Этот цвет уже у
ссылок, новый элемент с ним сольётся. Для различения бери другой признак (шрифт, вес,
подчёркивание) ИЛИ неакцентный цвет. Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

# Класс внутри .blog-content (новый элемент, не ссылка/заголовок).
BLOG_CLASS_RE = re.compile(r"\.blog-content\s+\.[\w-]+", re.IGNORECASE)
# Присвоение акцентного цвета (он закреплён за ссылками).
ACCENT_COLOR_RE = re.compile(
    r"color\s*:\s*var\(\s*--color-accent(?:-text)?\s*\)|"
    r"color\s*:\s*#(?:8b5cf6|ec4899)\b",
    re.IGNORECASE)


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
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if "/.claude/" in fp:
        return None
    if not fp.endswith("globals.css"):
        return None
    new = str(ti.get("new_string", "")) + "\n" + str(ti.get("content", ""))
    if not (BLOG_CLASS_RE.search(new) and ACCENT_COLOR_RE.search(new)):
        return None

    return (
        "БЛОК check_no_color_collision: ты красишь КЛАСС в .blog-content в акцентный цвет, "
        "но этот цвет УЖЕ занят ссылками (.blog-content a = var(--color-accent-text)). "
        "Класс ошибки 18.07: покрасил цены в фиолетовый ссылок — они слились, Boris: "
        "«ссылки и цены одного цвета». Возьми ДРУГОЙ признак различения (моно-шрифт, вес, "
        "подчёркивание) или неакцентный цвет — не тот, что уже у ссылок."
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
