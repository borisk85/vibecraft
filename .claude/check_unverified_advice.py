"""Stop hook — блокирует СОВЕТ поставить/использовать внешний инструмент/сервис для
задачи Boris, если в ЭТОМ ходу не было research (WebSearch/WebFetch), который
подтверждает что инструмент РЕАЛЬНО решает задачу и КАК (какой экран/раздел/кнопка).

Класс ошибки (14.07): посоветовал поставить vidIQ-расширение «вбей ключ в поиск
YouTube — покажет search volume». Оказалось боковая панель = Channel Stats, НЕ volume.
Boris потратил 10 мин впустую. Правдоподобное ≠ проверенное.
См. feedback_verify_tool_solves_task. Раньше был CapCut (оказался платным).
"""
import json
import re
import sys
from pathlib import Path

# Любой совет-императив ДЕЙСТВИЯ с внешним инструментом/сервисом/UI (не только vidiq).
ADVICE_RE = re.compile(
    r"(поставь|установи|скачай|подключи|используй|попробуй|заведи|"
    r"зайди|перейди|открой|нажми|вбей|кликни|включи|выбери|настрой|"
    r"переоптимизируй|перепиши|вынеси|перемести|замени|поменяй)\b"
    r"[^\n]{0,60}"
    r"(расширени|приложени|плагин|инструмент|сервис|сайт|аккаунт|настройк|"
    r"dashboard|консол|кабинет|панел|вкладк|раздел|кнопк|меню|iq\b|extension|"
    r"\.com|\.io|\.dev|\.org|\bChrome\b|браузер|vidiq|capcut|"
    r"youtube|тайтл|\btitle\b|заголов|\bтег|описани|\bканал|\bролик|метадан)",
    re.IGNORECASE | re.UNICODE,
)
# Код-контекст: совет по файлам/репо/командам — это НЕ внешний-инструмент, пропускаем.
CODE_CTX = re.compile(
    r"файл|\.json|\.py|\.tsx?|\.md|\.bat|строк|репо|git\b|коммит|пуш|деплой|Edit|Grep|Read|Bash|"
    r"код|функци|хук|скрипт|env|railway|vercel",
    re.IGNORECASE | re.UNICODE,
)
SEARCH_TOOLS = {"WebSearch", "WebFetch", "web_search", "web_fetch", "Fetch"}


def _is_tool_result(msg: dict) -> bool:
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def load_turn(tp: str):
    p = Path(tp)
    if not p.exists():
        return "", set()
    msgs = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            continue
    last = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            last = i
    if last == -1:
        return "", set()
    parts, tools = [], set()
    for m in msgs[last + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if not isinstance(b, dict):
                continue
            if b.get("type") == "text":
                parts.append(b.get("text", ""))
            elif b.get("type") == "tool_use":
                tools.add(b.get("name", ""))
    return "\n".join(parts), tools


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
    resp, tools = load_turn(tp)
    if not resp.strip():
        sys.exit(0)
    clean = re.sub(r"```[\s\S]*?```", "", resp)
    clean = re.sub(r"`[^`]*`", "", clean)
    m = ADVICE_RE.search(clean)
    if not m:
        sys.exit(0)
    # совет в код-контексте (файл/git/хук/деплой) = не внешний инструмент, пропускаем.
    # Окно ±90 симв вокруг совета (не по точке — домены с точками ломают границу).
    window = clean[max(0, m.start() - 90): m.end() + 90]
    if CODE_CTX.search(window):
        sys.exit(0)
    if tools & SEARCH_TOOLS:
        sys.exit(0)  # research в ходу был — совет подкреплён
    msg = (
        "НАРУШЕНИЕ check_unverified_advice: советуешь поставить/использовать внешний "
        "инструмент/сервис для задачи, но в ЭТОМ ходу НЕТ research (WebSearch/WebFetch), "
        "подтверждающего что он РЕАЛЬНО решает задачу и КАК именно (экран/раздел/кнопка). "
        "Класс «правдоподобное ≠ проверенное» — vidIQ-совет стоил Boris 10 минут. СТОП: "
        "сначала проверь research'ем конкретный путь решения, потом советуй; либо честно "
        "пометь «не проверял, где именно» без посыла наугад."
    )
    print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
