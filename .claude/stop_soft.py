"""Stop-хук-обертка — АНТИ-ДУБЛЬ ОТВЕТОВ В ЧАТЕ.

Класс ошибки (22.07): на один вопрос Boris видел два почти одинаковых ответа.
Причина не в генерации, а в архитектуре хуков. Claude Code стримит ответ в чат
СРАЗУ, а Stop-хуки запускаются уже ПОСЛЕ показа. Любой из ~33 блокирующих
Stop-хуков возвращал {"decision":"block"} — модель писала ответ заново, и в чате
оставались оба: забракованный и исправленный. Чем больше хуков, тем чаще дубль.

Блокировка при этом не убирает плохой ответ (он уже показан) — она только
ДОБАВЛЯЕТ второй. То есть цена блока = гарантированный дубль, а польза нулевая.

Решение — разделить проверки на два класса по тому, ЧЕГО они требуют:

HARD («не вставай, работай дальше») — очередь не пуста, есть незакоммиченное. Их
блок не плодит дубль: он заставляет делать СЛЕДУЮЩЕЕ дело, а не перепечатывать
уже показанный ответ. Остаются блокирующими.

SOFT («перепиши ответ») — стиль, филлеры, повторы, формулировки. Вот они и давали
дубль: ответ уже показан, переписывать его некуда. Их вердикт складывается в
pending_violations.json и подмешивается в начало следующего хода через
inject_violations.py — правило работает, дубля нет.

Класс ошибки (22.07, сразу после первой версии этого файла): мягким сделали ВСЁ,
включая check_no_stop_incomplete — и я встал с непустой очередью, потому что
удерживать стало нечему. Отсюда и разделение.

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

# HARD — требуют ПРОДОЛЖИТЬ РАБОТУ, а не переписать ответ. Блок здесь не даёт дубля.
HARD = [
    "check_attachments_stop.py",
    "check_no_stop_incomplete.py",
    "check_todo_dropped_stop.py",
    "check_no_uncommitted_stop.py",
]

# SOFT — требуют переписать уже показанный ответ. Только копим и отдаём в след. ход.
CHECKS = [
    "check_text_changes.py",
    "check_no_lie_report_without_fix.py",
    "check_no_false_done.py",
    "check_no_unverified_claim.py",
    "check_no_unverified_denial.py",
    "check_unverified_advice.py",
    "check_no_econ_from_head.py",
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
    # ДЫРА (Boris, 22.07): здесь стоял безусловный выход при stop_hook_active — и
    # после ПЕРВОГО же блока защита отключалась до конца хода. Отсюда «опять встал
    # с полной очередью»: первый стоп ловился, второй проходил насквозь. Теперь
    # решают сами HARD-хуки: у check_no_stop_incomplete есть свой счетчик кругов.
    repeat = bool(payload.get("stop_hook_active"))

    def _run(name):
        script = HERE / name
        if not script.exists():
            return None
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
            return None
        return _reason(proc)

    # HARD идут первыми: если работа не доделана, ход не заканчивается вовсе.
    for name in HARD:
        reason = _run(name)
        if reason:
            print(json.dumps({"decision": "block", "reason": reason}))
            sys.exit(0)

    if repeat:
        # Повторный стоп: HARD уже отработали выше. Копить стилевые замечания
        # второй раз подряд незачем — они те же самые.
        sys.exit(0)

    found = []
    for name in CHECKS:
        reason = _run(name)
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
