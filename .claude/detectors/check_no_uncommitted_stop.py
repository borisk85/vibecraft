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
        payload = json.loads(sys.stdin.buffer.read().decode("utf-8", "ignore") or "{}")
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
        # Дерево чистое, но коммиты могут лежать локально и не быть на проде.
        # Класс ошибки (06.08): закрыл сессию с двумя коммитами в main, которые не
        # уехали в origin. Boris смотрел прод и не видел ни одной правки, при этом
        # в отчете стояло «сделано». Чистое дерево про прод не говорит ничего.
        try:
            ahead = subprocess.run(
                ["git", "log", "origin/main..main", "--oneline"],
                cwd=ROOT, capture_output=True, text=True, timeout=15,
            )
        except Exception:
            sys.exit(0)
        pending = [l for l in (ahead.stdout or "").splitlines() if l.strip()]
        if pending and ahead.returncode == 0:
            print(json.dumps({"decision": "block", "reason": (
                f"НАРУШЕНИЕ check_no_uncommitted_stop: {len(pending)} коммит(ов) лежат "
                f"локально и НЕ запушены ({'; '.join(c[:60] for c in pending[:5])}). "
                "На проде их нет, значит для Boris работа не сделана. СЕЙЧАС: либо "
                "git push, либо, если правка ждет его выбора варианта, прямо написать "
                "в чат одной строкой, что именно висит и какого решения ждет. Молча "
                "вставать с непопавшей в прод работой запрещено."
            )}))
            sys.exit(0)
        sys.exit(0)
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
