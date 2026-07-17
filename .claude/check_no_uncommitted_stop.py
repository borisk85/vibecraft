"""Stop hook — ЗАПРЕТ вставать с незакоммиченными изменениями в репо.

Класс ошибки (2026-07-17): починил и протестировал хуки, отчитался «лежат
незакоммиченными» и встал. Boris в ярости: «нахуя мне незакоммиченные хуки?».
Правило CLAUDE.md: git push ВСЕГДА сразу после правки, не спрашивать. Оставить
работу незакоммиченной = наеб, к новой сессии потеряется/забудется.

Механизм: на Stop запускаю `git status --porcelain` в корне vibecraft. Если есть
незакоммиченные/неотслеженные файлы репо (транзиентное состояние хуков уже в
.claude/.gitignore, в выводе не появится) — блок: закоммить и запушь перед
остановкой. Fail-open, если git недоступен или ошибка.
"""
import json
import subprocess
import sys

ROOT = r"C:\Claude Code\vibecraft"


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    try:
        out = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=ROOT, capture_output=True, text=True, timeout=15,
        )
    except Exception:
        sys.exit(0)  # git недоступен — не мешаем работе
    if out.returncode != 0:
        sys.exit(0)
    lines = [l for l in out.stdout.splitlines() if l.strip()]
    if not lines:
        sys.exit(0)  # дерево чистое — ок
    sample = ", ".join(l[3:].strip() for l in lines[:8])
    reason = (
        "НАРУШЕНИЕ check_no_uncommitted_stop: ты встаёшь с НЕЗАКОММИЧЕННЫМИ "
        f"изменениями в репо ({len(lines)} файл(ов): {sample}). Правило CLAUDE.md — "
        "git push ВСЕГДА сразу после правки. ЗАПРЕЩЕНО заканчивать ход с висящей "
        "работой и словами «лежит незакоммиченным». СЕЙЧАС: git add + commit + push, "
        "потом останавливайся. Если файл осознанно НЕ версионируется — внеси в "
        ".gitignore, а не оставляй болтаться."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
