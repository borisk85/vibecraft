"""Stop-хук-обертка — АНТИ-ДУБЛЬ ОТВЕТОВ В ЧАТЕ.

Класс ошибки (22.07): на один вопрос Boris видел два почти одинаковых ответа.
Причина не в генерации, а в архитектуре хуков. Claude Code стримит ответ в чат
СРАЗУ, а Stop-хуки запускаются уже ПОСЛЕ показа. Любой из ~33 блокирующих
Stop-хуков возвращал {"decision":"block"} — модель писала ответ заново, и в чате
оставались оба: забракованный и исправленный. Чем больше хуков, тем чаще дубль.

Блокировка при этом не убирает плохой ответ (он уже показан) — она только
ДОБАВЛЯЕТ второй. То есть цена блока = гарантированный дубль, а польза нулевая.

Решение: все проверки прогоняются здесь же, но их вердикт больше не блокирует ход.
Причины складываются в pending_violations.json и подмешиваются в начало следующего
хода через inject_violations.py — правило работает, дубля нет.

Fail-open: любой сбой обертки/хука = молча пропускаем ход.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
PENDING = HERE / "pending_violations.json"
TIMEOUT = 20
MAX_KEEP = 6

# Проверки, чей вердикт раньше блокировал ход. Порядок = приоритет в отчете.
CHECKS = [
    "check_text_changes.py",
    "check_no_lie_report_without_fix.py",
    "check_no_false_done.py",
    "check_no_unverified_claim.py",
    "check_no_unverified_denial.py",
    "check_unverified_advice.py",
    "check_no_econ_from_head.py",
    "check_no_stop_incomplete.py",
    "check_no_uncommitted_stop.py",
    "check_answer_boris_q.py",
    "check_no_fix_question.py",
    "check_no_ty_prav.py",
    "check_chat_lint.py",
    "check_no_filler.py",
    "check_no_english.py",
    "check_no_chat_duplicate.py",
    "check_no_pause.py",
    "check_no_suggest_stop.py",
    "check_queue_on_new_task.py",
    "check_enqueue_command.py",
    "check_ui_visual_verify.py",
    "check_no_bossing_boris.py",
    "check_no_offtopic_injection.py",
    "check_no_empty_promise.py",
    "check_no_empty_status.py",
    "check_no_unvetted_fit.py",
    "check_no_hold_in_mind.py",
    "check_no_late_infeasibility.py",
    "check_no_comment_on_data.py",
    "check_no_regressive_advice.py",
    "check_no_offload_to_boris.py",
    "check_no_work_proposal.py",
]


def _reason(proc):
    """Достает причину из вердикта хука: и JSON-формат, и exit 2 + stderr."""
    out = (proc.stdout or "").strip()
    if out:
        for line in out.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue
            if data.get("decision") == "block" and data.get("reason"):
                return str(data["reason"]).strip()
    if proc.returncode == 2:
        err = (proc.stderr or "").strip()
        if err:
            return err
    return None


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)

    found = []
    for name in CHECKS:
        script = HERE / name
        if not script.exists():
            continue
        try:
            proc = subprocess.run(
                [sys.executable, str(script)],
                input=raw,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore",
                timeout=TIMEOUT,
            )
        except Exception:
            continue
        reason = _reason(proc)
        if reason:
            found.append(reason)

    if found:
        try:
            PENDING.write_text(
                json.dumps(found[:MAX_KEEP], ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass
    sys.exit(0)


if __name__ == "__main__":
    main()
