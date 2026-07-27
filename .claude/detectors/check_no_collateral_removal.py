"""PreToolUse (Edit/Write globals.css) — ЗАПРЕТ снести лишнее при удалении CSS.

Класс ошибки (18.07): откат ЦВЕТА заодно снёс nowrap — я убрал CSS-блок .c-price/.c-term
целиком, а в нём была не только окраска, но и white-space:nowrap (₸ на одной строке).
Команда была ТОЛЬКО про цвет — я удалил больше, чем велено (collateral).

Правило: если правка globals.css УДАЛЯЕТ CSS-свойства (они есть в old_string, но нет в
new_string) — блок с напоминанием: убери ТОЧЕЧНО только то, что велено; проверь, не
сносишь ли заодно чужое (nowrap, отступ, размер). Если удаление осознанно и по команде —
перечисли в подводке, что именно и почему убираешь.
"""
import json
import re
import sys

PROP_RE = re.compile(r"(?m)^\s*([a-z][a-z-]+)\s*:", re.IGNORECASE)


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if "/.claude/" in fp:
        return None
    if not fp.endswith("globals.css"):
        return None
    old = str(ti.get("old_string", ""))
    new = str(ti.get("new_string", ""))
    if not old or len(new) >= len(old):
        return None  # не удаление
    old_props = PROP_RE.findall(old)
    new_props = set(PROP_RE.findall(new))
    removed = [p for p in old_props if p not in new_props]
    if not removed:
        return None

    uniq = ", ".join(sorted(set(removed))[:6])
    return (
        f"БЛОК check_no_collateral_removal: правка удаляет CSS-свойства ({uniq}). Класс "
        "ошибки 18.07: откат цвета заодно снёс nowrap (₸ уехал в 2 строки) — я убрал блок "
        "целиком, хотя команда была только про цвет. СВЕРЬСЯ: убираешь РОВНО то, что "
        "велено, и НЕ сносишь ли заодно чужой фикс (nowrap/отступ/размер). Оставь нужное, "
        "удали только заказанное — точечно."
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
