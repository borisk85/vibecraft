"""PreToolUse (Edit/Write/MultiEdit на lib/blog-posts.ts) — блог-таблица ОБЯЗАНА быть
в house-формате: первый столбец ЦЕЛИКОМ жирный («**имя**»), без серых приписок после
закрывающих «**».

Класс ошибки (2026-07-18, повторялся 2 статьи подряд): при живой таблице-референсе
рядом я собирал новую таблицу «от себя» — лепил приписки в первый столбец
(«**Свой бот** в мессенджере», «**ИИ-агент** под задачу», «**Готовая платформа** записи»)
и образные срок/цена. check_consult_reference проверял, что я ЧИТАЛ референс, но НЕ что
таблица ему СООТВЕТСТВУЕТ. Этот хук проверяет РЕЗУЛЬТАТ: если в добавляемой таблице
первый столбец не «**имя**» целиком (есть текст после закрывающих «**») — блок.

Разрешено: «**Свой бот**», «**Связка на n8n или Make**» (все жирное). Запрещено:
«**Свой бот** в мессенджере» (серый хвост после звездочек).
"""
import json
import re
import sys

# Первый столбец: строка ЦЕЛИКОМ в двойных звездочках, ничего после закрывающих «**».
BOLD_ONLY = re.compile(r"^\*\*.+\*\*$")


def _payload_text(ti):
    parts = []
    for key in ("new_string", "content"):
        if isinstance(ti.get(key), str):
            parts.append(ti[key])
    for e in (ti.get("edits") or []):
        if isinstance(e, dict) and isinstance(e.get("new_string"), str):
            parts.append(e["new_string"])
    return "\n".join(parts)


def _bad_rows(text):
    bad = []
    for ln in text.split("\n"):
        s = ln.strip()
        if not s.startswith("|") or "**" not in s:
            continue
        cells = [c.strip() for c in s.strip().strip("|").split("|")]
        if len(cells) < 4:
            continue  # не 4-колоночная таблица блога
        first = cells[0]
        if "**" not in first:
            continue  # первый столбец без жирного — не наш паттерн
        if not BOLD_ONLY.match(first):
            bad.append(first)
    return bad


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if not fp.endswith("lib/blog-posts.ts"):
        sys.exit(0)
    bad = _bad_rows(_payload_text(ti))
    if not bad:
        sys.exit(0)
    reason = (
        "БЛОК check_table_house_format: в таблице блога первый столбец обязан быть "
        "ЦЕЛИКОМ жирным «**имя**» БЕЗ серых приписок после закрывающих «**». Нарушения: "
        + "; ".join(f"«{b}»" for b in bad[:4])
        + ". Это ровно та отсебятина, которую Boris правит руками каждую статью "
        "(«**Свой бот** в мессенджере» → «**Свой бот**»). Убери приписку или вбери ее "
        "внутрь звездочек, скопируй стиль существующих таблиц 1:1 и повтори правку."
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
