"""Stop hook — АНТИ-СТОП. Блокирует самовольную остановку на середине работы.

Претензия Boris (много раз): я останавливаюсь на середине задачи и жду его пинка
вместо того чтобы довести до конца. Механизм: если в последнем TodoWrite есть
пункт со статусом in_progress ИЛИ pending — стоп запрещён. Дыра «закрыл активный,
оставил pending и встал» (поймана Boris 08.07 на хуке cross-page) закрыта: очередь
должна быть ПУСТОЙ (все completed), иначе продолжай работать.
"""
import json
import sys
from pathlib import Path

STATE = Path(__file__).with_name(".stop_block_count")
MAX_ROUNDS = 2  # макс 2 напоминания подряд, потом пускает (было 12 → форсил до 12
                # моих доп-ответов на ОДИН вопрос Boris = каскад дублей с тем же смыслом).


def _rounds() -> int:
    try:
        return int(STATE.read_text().strip() or "0")
    except Exception:
        return 0


def _set_rounds(n: int):
    try:
        STATE.write_text(str(n))
    except Exception:
        pass


def _last_todos(messages):
    """Вернуть todos из ПОСЛЕДНЕГО вызова TodoWrite, иначе None."""
    todos = None
    for msg in messages:
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        for b in content:
            if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "TodoWrite":
                inp = b.get("input", {}) or {}
                t = inp.get("todos")
                if isinstance(t, list):
                    todos = t
    return todos


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    # ДЫРА (поймана Boris 08.07): после блока другим Stop-хуком повторный стоп
    # идет с stop_hook_active=true и раньше пропускался — можно было встать с
    # непустой очередью. Теперь блокируем и повторные стопы, но не более
    # MAX_ROUNDS подряд (защита от бесконечного цикла).
    if payload.get("stop_hook_active") and _rounds() >= MAX_ROUNDS:
        _set_rounds(0)
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)

    messages = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue

    todos = _last_todos(messages)
    if not todos:
        sys.exit(0)

    open_items = [
        t for t in todos
        if isinstance(t, dict) and t.get("status") in ("in_progress", "pending")
        # «⏳внешнее:» = пункт ждет ВНЕШНИЙ процесс (билд Vercel, CI) с уже
        # запущенным фоновым монитором, который сам разбудит ассистента.
        # Это НЕ самовольная пауза — такие пункты стоп не блокируют.
        # Использовать пометку можно ТОЛЬКО при реально висящем мониторе.
        and not str(t.get("content", "")).startswith("⏳внешнее:")
        # «⏸️boris:» = пункт РЕАЛЬНО заблокирован на решение/ОК/оплату Boris
        # (выбор концепции, копи на согласовании, платёж). Работа НЕ моя, ждёт
        # ЕГО ход — форсить меня выдавать доп-сообщения = каскад дублей и
        # выпрашивания (Boris: «3 сообщения на один вопрос»). Такие пункты стоп
        # НЕ блокируют. Использовать ТОЛЬКО когда мяч реально у Boris, не как
        # отмазку бросить свою работу.
        and not str(t.get("content", "")).startswith("⏸️boris:")
    ]
    if not open_items:
        _set_rounds(0)
        sys.exit(0)

    titles = "; ".join((t.get("content") or "")[:60] for t in open_items)
    reason = (
        "НАРУШЕНИЕ check_no_stop_incomplete: очередь НЕ пуста — открыты пункты "
        f"[{titles}], а ты останавливаешься. ЗАПРЕЩЕНО вставать с непустой очередью "
        "(in_progress И pending считаются). Возьми следующий открытый пункт и доведи "
        "его ДО КОНЦА (правка → проверка → деплой/пуш) прямо сейчас. Стоп разрешён "
        "только когда все пункты completed."
    )
    _set_rounds(_rounds() + 1)
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
