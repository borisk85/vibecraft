"""ref_guard — блокирующий хук против отсебятины в UI Vibecraft.

Логика:
- PostToolUse(Read): если прочитан референс Vibecraft (CLAUDE.md / components/sections /
  components/shared / app/globals.css) — помечаем в session-scoped маркер. Без вывода.
- PreToolUse(Write|Edit): если цель — UI-файл Vibecraft (app|components/**.tsx) и в этой
  сессии НЕ открыт бренд-гайд CLAUDE.md + минимум 2 компонента-образца — БЛОКИРУЕМ (deny).

Цель: физически не дать верстать страницы Vibecraft, не открыв референс. Fail-open при
любой ошибке (не ломать обычную работу). Вывод только при блокировке — не дублирует чат.
"""
import json
import sys
import os
import tempfile

try:
    data = json.loads(sys.stdin.read() or "{}")
except Exception:
    sys.exit(0)  # fail-open

event = data.get("hook_event_name", "")
tool = data.get("tool_name", "")
ti = data.get("tool_input", {}) or {}
fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
sid = str(data.get("session_id", "default"))
marker = os.path.join(tempfile.gettempdir(), f"vibecraft_refguard_{sid}.json")

REF_KEYS = (
    "vibecraft/claude.md",
    "vibecraft/components/sections",
    "vibecraft/components/shared",
    "vibecraft/app/globals.css",
)


def load():
    try:
        with open(marker, encoding="utf-8") as f:
            return set(json.load(f))
    except Exception:
        return set()


def save(s):
    try:
        with open(marker, "w", encoding="utf-8") as f:
            json.dump(sorted(s), f)
    except Exception:
        pass


# PostToolUse(Read): пометить прочитанный референс, без вывода
if event == "PostToolUse":
    if tool == "Read" and "vibecraft" in fp and any(k in fp for k in REF_KEYS):
        s = load()
        s.add(fp)
        save(s)
    sys.exit(0)

# PreToolUse(Write|Edit): блокировать UI-файл Vibecraft без референса
if event == "PreToolUse":
    is_vibe_ui = (
        "vibecraft" in fp
        and fp.endswith(".tsx")
        and ("/app/" in fp or "/components/" in fp)
    )
    if not is_vibe_ui:
        sys.exit(0)  # не наш кейс — тихо пропускаем (нет вывода = allow)

    s = load()
    has_claudemd = any("vibecraft/claude.md" in r for r in s)
    n_components = sum(
        1
        for r in s
        if "vibecraft/components/sections" in r or "vibecraft/components/shared" in r
    )
    if has_claudemd and n_components >= 2:
        sys.exit(0)  # референс открыт — allow, без вывода

    reason = (
        "БЛОК ref_guard: перед созданием/правкой UI-файла Vibecraft ОБЯЗАТЕЛЬНО открой "
        "референс в ЭТОЙ сессии через Read: (1) c:/Claude Code/vibecraft/CLAUDE.md "
        "(дизайн-правила, палитра, что НЕ делать); (2) минимум 2 компонента-образца из "
        "components/sections/ или components/shared/. Сейчас: "
        f"CLAUDE.md={'да' if has_claudemd else 'НЕТ'}, компонентов={n_components}/2. "
        "Прочитай их и повтори правку. Копируй паттерны 1:1, не изобретай."
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )
    sys.exit(0)

sys.exit(0)
