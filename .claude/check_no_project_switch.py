"""PreToolUse hook — АНТИ-ПРЫЖОК НА ДРУГОЙ ПРОЕКТ (общий механизм).

Причина (поймано Boris 17.07): работая над приложением Pet-to-Human, я по
неоднозначному «убрал прыганье шрифтов на сайте» САМОВОЛЬНО полез редактировать
velabot и vibecraft. Класс ошибки — НЕ конкретные проекты, а ПОВЕДЕНИЕ: прыгать
на любой проект вне текущего рабочего без команды.

Механизм ОБЩИЙ, не список-под-каждый-проект:
- «корень проекта» = папка сразу под `Claude Code/` (agent-builder-saas,
  vibecraft, tg-bot, …) или подпапка под scratchpad (рабочая копия).
- храню last_root в state-файле, обновляю при каждой правке.
- Edit/Write в ДРУГОМ корне (last != new) = СМЕНА проекта → блок, ЕСЛИ в
  последнем сообщении Boris нет явного сигнала на этот проект (его basename,
  алиас, или слова переключения «переключись/в проекте/займись/открой»).
- новый проект автоматически попадает под защиту (basename ловится сам);
  ALIASES — лишь помощник для человеческих названий, расширяется одной строкой.

Служебные пути (.claude/ memory/ docs/) не считаются сменой проекта — это мета.
"""
import json
import re
import sys
from pathlib import Path

STATE = Path(__file__).with_name(".last_project_root")

# человеческие алиасы (помощник, НЕ основа логики; basename ловится и без них)
ALIASES = {
    "agent-builder-saas": [r"\bvela\b", r"velabot", r"вела\b", r"велабот", r"лендинг"],
    "vibecraft": [r"вайбкрафт", r"вибкрафт", r"вайб\b"],
    "tg-bot": [r"клодуша", r"личн\w+ бот"],
    "vela-marketing-bot": [r"маркет", r"blog_writer", r"промпт\w*\s+бот",
                           r"генерац\w*\s+бот", r"бот\w*\s+генер", r"стать\w+\s+бот"],
    "support-bot": [r"саппорт", r"support"],
}
# слова, которыми Boris явно велит сменить проект
SWITCH_WORDS = [r"переключ", r"в проект", r"займись", r"открой проект", r"перейди"]
# служебное — не продуктовый код, сменой проекта не считается
SAFE = [r"[\\/]\.claude[\\/]", r"[\\/]memory[\\/]", r"[\\/]docs[\\/]", r"MEMORY\.md"]


def _root(fp: str):
    p = fp.replace("\\", "/")
    low = p.lower()
    if "scratchpad/" in low:
        after = p.split("scratchpad/", 1)[1] if "scratchpad/" in p else \
                p[low.index("scratchpad/") + len("scratchpad/"):]
        seg = after.split("/", 1)[0] if after else "scratchpad"
        return f"scratchpad:{seg}" if seg else None
    m = re.search(r"[Cc]laude [Cc]ode/([^/]+)", p)
    if m:
        return m.group(1)
    return None


_SVC_MARKERS = (
    "Stop hook feedback", "hook feedback", "НАРУШЕНИЕ check", "БЛОК check",
    "system-reminder", "hook additional context", "Жесткие правила",
    "task-notification", "<command-name", "persisted-output", "Caveat:",
    "Stop hook blocking",
)


def _last_user_text(messages, n: int = 12) -> str:
    """Текст ПОСЛЕДНИХ n РЕАЛЬНЫХ сообщений Boris (окно), не только самого последнего.
    Разрешение на смену проекта Boris часто даёт репликой-двумя раньше («правь бота»,
    «в этом маркетинг-боте»), а на следующей уже ругается без имени проекта. Одно
    последнее сообщение это разрешение теряло и хук ложно блокировал (дыра 17.07).
    Пропускаем tool_result И сообщения-фидбек хуков/служебные — иначе окно засоряется
    ими и реальные реплики Boris (с сигналом-именем проекта) выпадают."""
    texts = []
    for msg in messages:
        if msg.get("type") != "user":
            continue
        c = msg.get("message", {}).get("content", "")
        is_tool = (
            isinstance(c, list) and c
            and all(isinstance(b, dict) and b.get("type") == "tool_result" for b in c)
        )
        if is_tool:
            continue
        if isinstance(c, str):
            t = c
        elif isinstance(c, list):
            t = " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
        else:
            t = ""
        if not t.strip() or any(m in t for m in _SVC_MARKERS):
            continue
        texts.append(t)
    return " ".join(texts[-n:]).lower()


def _read_state():
    try:
        return STATE.read_text(encoding="utf-8").strip() or None
    except Exception:
        return None


def _write_state(root: str):
    try:
        STATE.write_text(root, encoding="utf-8")
    except Exception:
        pass


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)
    fp = str((payload.get("tool_input") or {}).get("file_path", ""))
    if not fp:
        sys.exit(0)

    for s in SAFE:  # служебное — не трогаем state, не блокируем
        if re.search(s, fp, re.IGNORECASE):
            sys.exit(0)

    root = _root(fp)
    if root is None:
        sys.exit(0)

    last = _read_state()
    if last is None or last == root:
        _write_state(root)
        sys.exit(0)

    # СМЕНА проекта — разрешена только при явном сигнале Boris
    tp = payload.get("transcript_path")
    last_text = ""
    if tp and Path(tp).exists():
        msgs = []
        for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                msgs.append(json.loads(line))
            except Exception:
                continue
        last_text = _last_user_text(msgs)

    basename = root.split(":")[-1]
    signals = [re.escape(basename)] + ALIASES.get(root, []) + ALIASES.get(basename, []) + SWITCH_WORDS
    if any(re.search(sig, last_text, re.IGNORECASE) for sig in signals):
        _write_state(root)
        sys.exit(0)

    reason = (
        f"БЛОК check_no_project_switch: ты правишь проект «{root}», а работал в «{last}». Это СМЕНА "
        f"проекта, но в последнем сообщении Boris нет ни названия «{basename}», ни команды переключиться. "
        f"Твой класс ошибки (17.07): по неоднозначной формулировке («сайт», «это», «шрифты») прыгаешь на "
        f"ДРУГОЙ проект и правишь его самовольно. СТОП: держи текущий проект «{last}» ИЛИ уточни у Boris, "
        f"какой проект он имеет в виду. Не гадай в сторону другого проекта."
    )
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
