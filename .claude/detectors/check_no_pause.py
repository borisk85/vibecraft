"""Stop hook — блокирует ПАУЗУ-хвост: концовку ответа, где я встаю и жду Boris
вместо того чтобы действовать.

Правило (жёсткая претензия Boris): есть данные и команда → делаю и деплою, НЕ
заканчиваю ход на «жду / скажи — сделаю / готов по команде / на твою правку /
направление за тобой / твой выбор». Это пустая пауза, наёб вместо работы.

Логика: смотрим ХВОСТ ответа (последние ~200 символов). Если он заканчивается
сигналом ожидания/передачи хода — блокируем. Не завязано на «?» (паузы бывают
утвердительными: «жду твою правку.»).
"""
import json
import re
import sys
from pathlib import Path


# Сигналы паузы/передачи хода в КОНЦЕ ответа. Ловим мои реальные концовки:
# «жду твою правку», «скажешь — доведу», «готов вставить по команде»,
# «на твою правку», «направление за тобой», «твой выбор/вызов», «жду отмашку».
PAUSE_RE = re.compile(
    r"("
    r"\bжд[уеё]\b|\bждать\b|\bжд[её]м\b|"
    r"жду\s+(?:тво|команд|отмашк|правк|ответ|решени|выбор|указани)|"
    r"дай\s+отмашк|жду\s+отмашк|дожида\w*|остал[оа]сь\s+дождат|"
    r"на\s+тво[юейяё]+\s+(?:правк|решени|выбор|усмотрен)|"
    r"по\s+тво[ейёя]+\s+команд|как\s+скажешь|"
    r"\bскажешь\b|\bскажи\b(?!\s+спасибо)|"
    r"готов\s+\w+|"
    r"тво[йяёе]+\s+(?:выбор|вызов|call|ход|слово|решени|команд)|"
    r"направлени\w*\s+за\s+тобой|за\s+тобой\b|"
    r"реши\w*\s+(?:какой|какую|что|как)|скаж\w*\s+(?:какой|какую|что|старт|делай)|"
    # анонс будущей работы в конце ответа = остановка вместо действия сейчас
    r"дела[юем]\s+\w+\s+(?:сейчас|следующ)|бер[уёе]\s+(?:\w+\s+){0,2}следующ|"
    r"следующим\s+пунктом|перехожу\s+к\b|приступа[юел]\w*|разбер\w+\s+следующ|"
    r"дальше\s+(?:дела|бер|по\s+очеред|разбер)|иду\s+к\s+следующ|продолж\w+\s+следующ|"
    r"этот\s+пункт\s+следующим|беру\s+этот|"
    # отказ чинить ошибку без команды = запрещённое ожидание (ошибки чинятся сразу)
    r"без\s+команды\s+не\s+трога|не\s+трога\w*\s+без\s+команды|"
    r"жду\s+команд\w*\s+на\s+(?:фикс|правк|исправ)|дожида\w*\s+команд"
    r")",
    re.IGNORECASE | re.UNICODE,
)


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
    return all(b.get("type") == "tool_result" for b in content)


def load_response(transcript_path: str) -> str:
    p = Path(transcript_path)
    if not p.exists():
        return ""
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
    if last_human_idx == -1:
        return ""
    response_parts = []
    for msg in messages[last_human_idx + 1:]:
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        response_parts.append(_get_text(content))
    return "\n".join(response_parts)


def is_pause_ending(response: str) -> bool:
    """True, если ответ заканчивается паузой-ожиданием (последние ~200 символов)."""
    text = response.strip()
    if not text:
        return False
    tail = text[-200:]
    m = PAUSE_RE.search(tail)
    if not m:
        return False
    # Совпадение внутри перечисления (список слов через запятую или «/», часто в
    # кавычках «…») — не пауза, а цитирование слов. Кейсы: печатаю список
    # слов-пустышек с «как скажешь»; объясняю хук и цитирую «молчу / стою / жду».
    ls = tail.rfind("\n", 0, m.start()) + 1
    le = tail.find("\n", m.end())
    if le == -1:
        le = len(tail)
    line = tail[ls:le]
    if line.count(",") >= 3 or line.count("/") >= 2:
        return False
    if "«" in line and ("/" in line or "," in line):
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
    response = load_response(transcript_path)
    if not response.strip():
        sys.exit(0)
    if is_pause_ending(response):
        reason = (
            "НАРУШЕНИЕ check_no_pause: ответ заканчивается ПАУЗОЙ-ожиданием "
            "('жду / скажи — сделаю / готов по команде / на твою правку / "
            "направление за тобой / твой выбор'). ЗАПРЕЩЕНО вставать и ждать, "
            "когда следующий шаг ясен из данных и команды. Убери паузу-хвост: "
            "либо ВЫПОЛНИ следующий шаг прямо сейчас (Edit/Bash) и отчитайся о "
            "сделанном, либо, если реально нужен выбор Boris, дай его как факт "
            "без фразы-ожидания в конце."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
        sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
