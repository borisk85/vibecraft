"""Stop hook — запрет деплоить UI без РЕАЛЬНОЙ визуальной проверки Playwright.

Класс ошибки (14-15.07): я добавил Hero-плашку, написал в подводке «проверю через
Playwright» (обещание сняло PreToolUse-хук check_ui_playwright), задеплоил на прод и
НЕ проверил. Boris: «плейрайт где тварь?! как ты UI смотришь». Обещание != проверка.

Этот Stop-хук смотрит ВЕСЬ ход: если в нём был Edit/Write UI-файла (.tsx компонент
или страница с версткой) И деплой лендинга (vercel --prod), но НЕ было ни одного
реального вызова Playwright (browser_navigate / browser_take_screenshot / browser_snapshot),
то блокирует. Проверка UI должна быть скриншотом прода, а не словом «проверю».
"""
import json
import re
import sys
from pathlib import Path

UI_FILE_RE = re.compile(r"\.tsx$", re.IGNORECASE)
UI_PATH_RE = re.compile(r"(/components/|/app/|/sections/|Hero|Pricing|FAQ|Footer|SocialProof)",
                        re.IGNORECASE)
DEPLOY_RE = re.compile(r"vercel\s+.*--prod|--prod", re.IGNORECASE)
BROWSER_TOOLS = ("browser_navigate", "browser_take_screenshot", "browser_snapshot",
                 "browser_resize")


def _is_tool_result(m: dict) -> bool:
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def load_turn(tp: str):
    p = Path(tp)
    if not p.exists():
        return []
    msgs = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            continue
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            last_human = i
    tools = []
    for m in msgs[last_human + 1:]:
        if m.get("type") != "assistant":
            continue
        c = m.get("message", {}).get("content", [])
        if isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "tool_use":
                    tools.append((b.get("name", ""), b.get("input", {}) or {}))
    return tools


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp:
        sys.exit(0)
    tools = load_turn(tp)
    if not tools:
        sys.exit(0)

    ui_edit = False
    deploy = False
    visual = False
    for name, inp in tools:
        if name in ("Edit", "Write", "MultiEdit"):
            fp = str(inp.get("file_path", "")).replace("\\", "/")
            if "/.claude/" in fp.lower():
                continue
            if UI_FILE_RE.search(fp) and UI_PATH_RE.search(fp):
                ui_edit = True
        if name in ("Bash", "PowerShell"):
            cmd = str(inp.get("command", ""))
            if DEPLOY_RE.search(cmd):
                deploy = True
        if any(bt in name for bt in BROWSER_TOOLS):
            visual = True

    if ui_edit and deploy and not visual:
        msg = (
            "НАРУШЕНИЕ check_ui_visual_verify: в этом ходу ты правил UI (.tsx) и задеплоил "
            "лендинг (vercel --prod), но НИ РАЗУ не проверил визуал через Playwright. "
            "Обещание «проверю» не считается. СДЕЛАЙ реально: browser_navigate на прод, "
            "browser_resize (моб 375 и планшет 768), browser_take_screenshot, посмотри "
            "как UI лёг на всех размерах. Только после реального скриншота отчитывайся."
        )
        print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
