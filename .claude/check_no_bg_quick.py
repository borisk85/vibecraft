"""PreToolUse hook (Bash) — запрещает пускать в фон (run_in_background) быструю
read-команду, нужную для НЕМЕДЛЕННОГО ответа. Фон = только долгие (деплой/билд/
install), не grep/find/cat.

Класс ошибки (10.07): пустил grep по папкам в background, переключился на другой
вопрос, БРОСИЛ вопрос Boris (workspace.ru) без ответа. Boris в ярости: «хули встал/
не бросай дела». Быстрый grep — доли секунды, его надо foreground: тогда ответ в
том же ходу, нить не теряется.

Правило: run_in_background=true разрешён ТОЛЬКО для явно долгих команд (vercel/
railway/npm/yarn/pip/build/install/docker/git push/dev-сервер). Для grep/find/cat/
ls/rg/awk/head/tail в фоне — блок: делай foreground и отвечай сразу.
"""
import json
import re
import sys

QUICK_RE = re.compile(r"\b(grep|rg|find|cat|ls|head|tail|awk|sed|wc|git\s+show|git\s+log|git\s+diff)\b", re.I)
LONG_OK_RE = re.compile(
    r"(vercel|railway|npm\s+(i|install|run|ci)|yarn|pnpm|pip\s+install|"
    r"docker|\bbuild\b|\btsc\b|next\s+build|git\s+push|uvicorn|python\s+-m\s+src|"
    r"serve|dev\b|watch\b|sleep\b|pytest|playwright)",
    re.I,
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("hook_event_name") != "PreToolUse" or data.get("tool_name") != "Bash":
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    if not ti.get("run_in_background"):
        sys.exit(0)
    cmd = str(ti.get("command", ""))
    if LONG_OK_RE.search(cmd):
        sys.exit(0)  # реально долгая — фон оправдан
    if QUICK_RE.search(cmd):
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    "БЛОК check_no_bg_quick: быструю read-команду (grep/find/cat/git show) "
                    "НЕЛЬЗЯ в фон — так ты бросаешь вопрос Boris и теряешь нить (класс "
                    "'grep в background → забыл ответить'). Запусти БЕЗ run_in_background "
                    "(foreground), получи результат и ответь в этом же ходу. Фон — только "
                    "для деплоя/билда/install/dev-сервера."
                ),
            }
        }))
        sys.exit(0)


if __name__ == "__main__":
    main()
