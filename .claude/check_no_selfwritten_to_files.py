"""PreToolUse hook — ПРЕДОХРАНИТЕЛЬ: нельзя записывать в файлы-документы Boris
самосочинённый контент (любой, не только маркетинг) без его явной команды.

Класс ошибки (Boris в ярости, стоил ему кучу времени): я генерирую контент от
себя — планы, «стратегии», выдуманные факты о бизнесе, каналы, выводы — и пишу
это в его .md-файлы как будто согласованная правда. Потом ещё показываю ему. Это
прямое нарушение правила «ничего от себя». Пример: marketing-plan.md, набитый
партнёрствами/аутричем/Product Hunt, которых у Boris нет.

Правило: писать/дополнять документ (.md/.txt) в проекте можно ТОЛЬКО когда Boris
явно это поручил в текущем сообщении (запиши/создай/составь/добавь/задокументируй/
веди файл/план). Без команды крупная вставка прозы в документ = блок.

НЕ гейтим:
  - файлы в .claude/ (сами хуки/конфиг);
  - код (.py/.ts/.tsx/.js/.json и т.п.) — он правится по задачам разработки;
  - удаление/сокращение (чистка) — прирост текста <= порога;
  - мелкие правки (отметки, однострочные) — прирост ниже порога.
"""
import json
import re
import sys
from pathlib import Path

DOC_EXT = (".md", ".mdx", ".markdown", ".txt")
GROWTH_LIMIT = 200  # символов прироста прозы без команды — выше = блок

# Явная команда Boris писать/создавать/дополнять документ.
CMD_RE = re.compile(
    r"(запиш|запис\w*|создай|создать|состав\w*|добав\w*|внес[иё]\w*|"
    r"напиши\s+(?:в\s+файл|доку|план|черновик|текст)|задокумент\w*|"
    r"сохрани\b|обнови\s+файл|веди\s+файл|веди\s+спис|отмеч\w*|помет\w*|"
    r"(?:запиши|веди|обнови|составь|в)\s+план|черновик|заполни\b|допиши\b|"
    r"зафиксир\w*\s+(?:в|это|решени|наход)|документ\w*\s+это|"
    # Указание МЕСТА записи = команда записать, даже без глагола.
    # Boris пишет «в бэклог после дохода», «это в доки» — глагол опускает,
    # а хук требовал «запиши» и блокировал commanded-работу, заставляя
    # повторять команду дважды (15.07, ярость).
    r"в\s+б[эе]клог|в\s+backlog|в\s+доки\b|в\s+докум\w*|в\s+docs\b|"
    r"в\s+бэклог\w*|занеси\w*|заноси\w*)",
    re.IGNORECASE | re.UNICODE,
)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "<ide_opened_file", "system-reminder",
)

# Проверенная НАХОДКА/ФАКТ (не отсебятина): ссылки на код file:line, пути к
# исходникам, пометки о проверке. Такое НАДО сохранять — не гейтим, даже без
# явного «запиши». Отсебятина (marketing-plan) таких маркеров не несёт.
FINDING_RE = re.compile(
    r"([\w./-]+\.(?:py|ts|tsx|js|jsx|json|sql):\d+|src/[\w/]+\.\w+|"
    r"проверено\s+по\s+коду|по\s+коду\b|grep|plaintext|sslmode|Fernet|"
    r"nofollow|dofollow|do-follow|rel=|firecrawl|редирект|прокладк|"
    r"проверено\s+firecrawl|проверено\s+\w+\s+\d{2}\.\d{2}|"
    r"`[\w./-]+\.(?:py|ts|tsx|js)`)",
    re.IGNORECASE | re.UNICODE,
)


def _is_tool_result_message(msg: dict) -> bool:
    content = msg.get("message", {}).get("content", [])
    if not isinstance(content, list) or not content:
        return False
    return all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in content
    )


def _last_human_text(transcript_path: str) -> str:
    """Последние 5 человеческих сообщений Boris (не только самое последнее).

    Команда «запиши/поправь/пересчитай в файлах» дается в НАЧАЛЕ многоходовой
    задачи, а правки идут много ходов спустя — окно в 1 сообщение давало ложные
    блоки на commanded-работе (12.07: пересчет экономики, правка КБ).
    """
    p = Path(transcript_path)
    if not p.exists():
        return ""
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    collected = []
    for msg in reversed(messages):
        if msg.get("type") != "user" or _is_tool_result_message(msg):
            continue
        c = msg.get("message", {}).get("content")
        text = ""
        if isinstance(c, str):
            text = c
        elif isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "text":
                    text += " " + b.get("text", "")
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S)
        if any(m in text for m in SERVICE_MARKERS):
            # служебная вставка — не команда Boris, идём дальше назад
            continue
        collected.append(text)
        if len(collected) >= 5:
            break
    return " \n ".join(collected)


def _growth(tool_name: str, ti: dict) -> int:
    if tool_name == "Write":
        return len(str(ti.get("content", "")))
    if tool_name == "Edit":
        return len(str(ti.get("new_string", ""))) - len(str(ti.get("old_string", "")))
    if tool_name == "MultiEdit":
        g = 0
        for e in ti.get("edits", []) or []:
            g += len(str(e.get("new_string", ""))) - len(str(e.get("old_string", "")))
        return g
    return 0


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("hook_event_name") != "PreToolUse":
        sys.exit(0)
    tool = data.get("tool_name")
    if tool not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    target = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if not target:
        sys.exit(0)
    if "/.claude/" in target or "/node_modules/" in target:
        sys.exit(0)
    # Служебные рабочие файлы Claude Code (инструкции проекту, не контент Boris) —
    # их я легитимно веду сам, не гейтим.
    basename = target.rsplit("/", 1)[-1]
    if basename in ("claude.md", "claude.local.md", "agents.md", ".cursorrules"):
        sys.exit(0)
    # KB маркет-бота — по CLAUDE.md обновляется АВТОМАТИЧЕСКИ после любой правки
    # фичи/текстов/лимитов VELA («не спрашивать, не ждать команды») — не гейтим.
    if basename in ("knowledge_base.md", "vela_modules.md", "vela_tech.md"):
        sys.exit(0)
    if not target.endswith(DOC_EXT):
        sys.exit(0)  # код и прочее не гейтим
    if _growth(tool, ti) <= GROWTH_LIMIT:
        sys.exit(0)  # удаление/чистка/мелочь
    tp = data.get("transcript_path")
    last = _last_human_text(tp) if tp else ""
    if CMD_RE.search(last):
        sys.exit(0)  # Boris явно поручил писать
    content = str(ti.get("content", "")) + str(ti.get("new_string", ""))
    if FINDING_RE.search(content):
        sys.exit(0)  # проверенная находка/факт из кода — сохранять НАДО, не отсебятина
    reason = (
        "БЛОК check_no_selfwritten_to_files: ты пишешь крупный блок в документ "
        "Boris, а в его текущем сообщении НЕТ команды это записать/создать/"
        "составить. Класс marketing-plan — отсебятина в чужих файлах, прямой "
        "запрет «ничего от себя». СТОП: не сочиняй контент в файлы Boris сам. "
        "Если он не поручал записывать — не пиши; если поручал — дождись явной "
        "команды (запиши/создай/составь/добавь) и только тогда."
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
