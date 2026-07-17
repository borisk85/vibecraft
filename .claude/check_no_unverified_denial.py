"""Stop hook — блокирует ЗАЯВЛЕНИЕ ОБ ОТСУТСТВИИ/НЕВОЗМОЖНОСТИ без проверки.

Класс ошибки (general, повторяется): Boris просит нечто (файл, логотип, данные,
фичу), а я в ответ пишу «у меня нет X / дать не могу / нужен исходник / не нашёл /
этого нет» — НЕ сделав ни одной проверки в этом же ходу (Read/Glob/Grep/Bash/
Agent/WebSearch/WebFetch). Это враньё «на вскидку»: тот же класс, что «конкурентов
нет» без web_search (MailKit) и «этого не реализовано» без grep.

Правило: перед любым «нет / не могу / нужен исходник» СНАЧАЛА реально проверь
инструментом. Если проверка в ходу была — заявление законно, не гейтим.

Логика Stop-хука:
  1. Взять текст моего ответа после последнего человеческого сообщения Boris.
  2. Если в ХВОСТЕ/теле есть паттерн отрицания наличия ресурса/данных/файла —
  3. И при этом в ЭТОМ ЖЕ ходу НЕ было ни одного проверочного tool_use —
     → блок: сначала проверь, потом заявляй.
"""
import json
import re
import sys
from pathlib import Path

# Заявления об ОТСУТСТВИИ ресурса/файла/данных или НЕВОЗМОЖНОСТИ выдать его.
# Ловим именно «нет объекта / не могу дать объект / нужен исходник», НЕ «не могу
# решить задачу без риска» (это про способность, законно по CLAUDE.md).
DENIAL_RE = re.compile(
    r"("
    r"дать\s+не\s+могу|"
    r"не\s+могу\s+(?:дать|найти|достать|предостав\w*|сгенер\w*|выдать|получить|показать)|"
    r"(?:у\s+меня\s+)?нет\s+(?:доступа|логотип\w*|файл\w*|исходник\w*|картинк\w*|"
    r"изображени\w*|данн\w*|такого\s+файл\w*|нужн\w*\s+файл\w*)|"
    r"нужен\s+(?:файл|исходник|логотип|оригинал|доступ)\b|"
    r"нужн[оы]\s+(?:файл|исходник|логотип|оригинал)\b|"
    r"дай\s+(?:файл|исходник|логотип|оригинал)\b|"
    r"не\s+наш[её]л\w*|не\s+удал[оа]сь\s+найти|не\s+существует\b|"
    r"отсутству\w+|этого\s+нет\b|такого\s+нет\b|"
    r"нельзя\s+[^.]{0,40}\bбез\s+(?:файл|исходник\w*|логотип\w*|оригинал\w*|доступ\w*)|"
    r"текстом\s+(?:дать|выдать)\s+не\s+могу|"
    r"это\s+картинк\w+[^.]{0,30}не\s+могу|не\s+могу[^.]{0,30}картинк\w+|"
    # инверсия: «(такого) файла/лого/исходника ... нет», «в проекте/репо нет»
    r"(?:лого\b|логотип\w*|файл\w*|исходник\w*|картинк\w*|изображени\w*|ассет\w*)[^.\n]{0,40}\bнет\b|"
    r"в\s+(?:проект\w*|репозитори\w*|репо|коде|папк\w*)\b[^.\n]{0,30}\bнет\b"
    r")",
    re.IGNORECASE | re.UNICODE,
)

# tool_use, которые считаются реальной проверкой факта в этом ходу.
VERIFY_TOOLS = {
    "Read", "Glob", "Grep", "Bash", "PowerShell", "Agent", "Task",
    "WebSearch", "WebFetch", "ToolSearch", "LS", "NotebookRead",
}


def _get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return " ".join(parts)
    return ""


def _is_tool_result_message(msg: dict) -> bool:
    content = msg.get("message", {}).get("content", [])
    if not isinstance(content, list) or not content:
        return False
    return all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in content
    )


def _load(transcript_path: str):
    p = Path(transcript_path)
    if not p.exists():
        return [], -1
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    last_human_idx = -1
    for i, msg in enumerate(messages):
        if msg.get("type") == "user" and not _is_tool_result_message(msg):
            last_human_idx = i
    return messages, last_human_idx


def _response_text(messages, start_idx) -> str:
    parts = []
    for msg in messages[start_idx + 1:]:
        if msg.get("type") != "assistant":
            continue
        parts.append(_get_text(msg.get("message", {}).get("content", [])))
    return "\n".join(parts)


_EMPTY_MARKERS = (
    "no files found", "does not exist", "file does not exist", "no such file",
    "no matches", "0 matches", "not found", "ничего не найдено", "не найдено",
)


def _blocks(msg):
    c = msg.get("message", {}).get("content", [])
    return c if isinstance(c, list) else []


def _result_text(block) -> str:
    c = block.get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return " ".join(
            b.get("text", "") for b in c
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return ""


def _looks_empty(txt: str) -> bool:
    """Результат проверки пустой или это маркер «не найдено»."""
    t = txt.strip().lower()
    if not t:
        return True
    if len(t) < 80 and any(m in t for m in _EMPTY_MARKERS):
        return True
    return False


def _verified_in_turn(messages, start_idx) -> bool:
    """True только если хоть одна проверка в этом ходу вернула РЕАЛЬНЫЕ данные.
    Пустой Glob/Grep («No files found») или Read несуществующего файла НЕ считается
    доказательством отсутствия — по одному пустому узкому поиску заявлять «нет»
    нельзя, надо искать шире (другой паттерн, корень репо, веб)."""
    id_to_name = {}
    for msg in messages[start_idx + 1:]:
        if msg.get("type") == "assistant":
            for b in _blocks(msg):
                if (isinstance(b, dict) and b.get("type") == "tool_use"
                        and b.get("name") in VERIFY_TOOLS):
                    id_to_name[b.get("id")] = b.get("name")
        else:
            for b in _blocks(msg):
                if (isinstance(b, dict) and b.get("type") == "tool_result"
                        and b.get("tool_use_id") in id_to_name):
                    if not _looks_empty(_result_text(b)):
                        return True
    return False


def _is_denial(response: str) -> bool:
    text = response.strip()
    if not text:
        return False
    m = DENIAL_RE.search(text)
    if not m:
        return False
    # Цитирование внутри перечисления/кавычек — не заявление, а объяснение хука.
    ls = text.rfind("\n", 0, m.start()) + 1
    le = text.find("\n", m.end())
    if le == -1:
        le = len(text)
    line = text[ls:le]
    if "«" in line and line.count("/") >= 2:
        return False
    return True


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    transcript_path = payload.get("transcript_path")
    if not transcript_path:
        sys.exit(0)
    messages, last_human_idx = _load(transcript_path)
    if last_human_idx == -1:
        sys.exit(0)
    response = _response_text(messages, last_human_idx)
    if not _is_denial(response):
        sys.exit(0)
    if _verified_in_turn(messages, last_human_idx):
        sys.exit(0)  # проверил инструментом — заявление законно
    reason = (
        "НАРУШЕНИЕ check_no_unverified_denial: ты заявил «нет / не могу дать / "
        "нужен исходник / не нашёл / этого нет», НЕ сделав ни одной проверки в "
        "этом ходу (Read/Glob/Grep/Bash/Agent/WebSearch). Это враньё на вскидку "
        "— тот же класс, что «конкурентов нет» без поиска и «не реализовано» без "
        "grep. СТОП: сначала реально проверь инструментом (найди файл/логотип/"
        "данные в репо или в сети), и только потом говори есть оно или нет."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
