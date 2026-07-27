"""Агрегатор хуков: одна точка входа на группу вместо десятка регистраций.

Причина (27.07.2026): в settings.local.json висело 37 отдельных вызовов, по 6-8
сторожей на одну тему. Они срабатывали каскадом друг за другом на одну правку,
а найти, какой именно блокирует, было нельзя. Теперь тема = одна регистрация.

Логика детекторов не переписана, а перенесена в .claude/detectors/ и вызывается
отсюда: в каждом накоплены исключения за месяцы работы, переписывание вручную
дало бы ложные срабатывания на ровном месте.

Запуск: python hook_group.py <имя_группы>
Первый детектор, вернувший блок, останавливает перебор и отдает свой вердикт
в формате, который ждет текущее событие (PreToolUse deny / Stop block).

Fail-open: сбой детектора, таймаут, отсутствие файла — пропускаем молча.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
DET = HERE / "detectors"
TIMEOUT = 20

GROUPS = {
    # правка контента: сверься с референсом, не выдумывай копи и факты
    "content": [
        "check_consult_reference.py",
        "check_vela_before_blog_visual.py",
        "check_no_invented_copy.py",
        "check_verbatim_dictation.py",
        "check_copy_facts_pretool.py",
        "check_no_selfwritten_to_files.py",
    ],
    # визуал и браузер: не трогать вслепую, не добавлять непрошенное, не лезть в
    # Playwright на кодовую задачу и не деплоить UI без реального взгляда
    "visual": [
        "check_ui_playwright_pretool.py",
        "check_no_unrequested_visual.py",
        "check_no_collateral_removal.py",
        "check_playwright_only_on_command.py",
        "check_no_playwright_for_code.py",
        "check_ui_visual_verify.py",
    ],
    # очередь задач: не терять, не прыгать, добавлять по команде
    "queue": [
        "check_todo_no_drop.py",
        "check_no_task_jump.py",
        "check_queue_before_switch.py",
        "check_queue_on_new_task.py",
        "check_enqueue_command.py",
        "check_todo_dropped_stop.py",
    ],
    # утверждения без проверки инструментом
    "verified": [
        "check_no_unverified_claim.py",
        "check_no_unverified_denial.py",
        "check_unverified_advice.py",
        "check_no_unvetted_fit.py",
        "check_no_false_done.py",
        "check_no_econ_from_head.py",
    ],
    # HARD-стоп: работа не доделана, вставать нельзя
    "stop_hard": [
        "check_no_stop_incomplete.py",
        "check_no_uncommitted_stop.py",
    ],
    # SOFT-стоп: пауза, пустой статус, пустое обещание
    "stop_soft": [
        "check_no_pause.py",
        "check_no_empty_status.py",
        "check_no_empty_promise.py",
    ],
    # стиль реплики: согласие, филлеры, английский, повтор сказанного
    "style": [
        "check_no_ty_prav.py",
        "check_chat_lint.py",
        "check_no_filler.py",
        "check_no_english.py",
        "check_no_chat_duplicate.py",
    ],
}


def _verdict(proc):
    """Достает причину блока: и JSON-формат, и exit 2 + stderr."""
    for line in (proc.stdout or "").splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            data = json.loads(line)
        except Exception:
            continue
        if data.get("decision") == "block" and data.get("reason"):
            return str(data["reason"]).strip()
        spec = data.get("hookSpecificOutput") or {}
        if spec.get("permissionDecision") == "deny":
            return str(spec.get("permissionDecisionReason", "")).strip()
    if proc.returncode == 2 and (proc.stderr or "").strip():
        return proc.stderr.strip()
    return None


def main():
    group = sys.argv[1] if len(sys.argv) > 1 else ""
    names = GROUPS.get(group)
    raw = sys.stdin.read()
    if not names:
        sys.exit(0)
    try:
        payload = json.loads(raw)
    except Exception:
        sys.exit(0)
    event = payload.get("hook_event_name", "")

    for name in names:
        # detectors/ основное место; корень .claude — запасное, чтобы перенос
        # файлов и правка конфига не обязаны были случиться в одну секунду
        script = DET / name
        if not script.exists():
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
        reason = _verdict(proc)
        if not reason:
            continue
        if event == "PreToolUse":
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }))
        else:
            print(json.dumps({"decision": "block", "reason": reason}))
        sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
