"""PreToolUse hook — блокирует УДАЛЕНИЕ слова/факта, источник которого Boris
только что ПОСТАВИЛ ПОД ВОПРОС (обоснуй / откуда / какой нахуй / где пруф /
не отсебятина), но команды УДАЛИТЬ не давал.

Класс ошибки (повторяется): Boris спрашивает «откуда тут X, обоснуй» —
я слышу «удали X» и прыгаю в удаление вместо объяснения источника.
Правило: сначала ОБОСНУЙ источник в чате, не удаляй молча. Разблокирует
только явная команда удаления (убери / удали / выкинь / снеси).

Механизм: если в последних сообщениях Boris есть вопрос-к-источнику и НЕТ
команды удаления, а правка services-pages.ts ВЫКИДЫВАЕТ токен, который Boris
назвал в вопросе («какой нахуй конструктор» → токен «конструктор») —
DENY. Токен присутствует в old_string и отсутствует в new_string = удаление.
"""
import json
import re
import sys


SRC_Q_RE = re.compile(
    r"(обоснуй|обоснов|\bоткуда\b|где\s+пруф|\bпруф|где\s+источник|"
    r"источник\w*\s*[?!]|с\s+чего\s+(?:ты\s+)?взял|почему.{0,25}истин|"
    r"как(?:ой|ая|ое|ие)\s+нахуй|не\s+отсебятин|\bотсебятин)",
    re.IGNORECASE | re.UNICODE,
)

DELETE_CMD_RE = re.compile(
    r"(убер\w*|удал\w*|выкин\w*|выпил\w*|снес\w+|вырежи|вырезать|"
    r"дроп\w+|\bубрать\b|\bсотри\b|\bснять\b|замени\w*|перепиш\w*)",
    re.IGNORECASE | re.UNICODE,
)

TOKEN_RE = re.compile(
    r"как(?:ой|ая|ое|ие)\s+нахуй\s+([а-яё]{4,})|"
    r"\bоткуда\b\s+(?:тут\s+|там\s+|он\s+|это\s+|оно\s+|взял[аи]?\s+)?([а-яё]{4,})|"
    r"почему\s+(?:тут\s+|там\s+|забыл\s+)?([а-яё]{5,})",
    re.IGNORECASE | re.UNICODE,
)

STOP = {
    "нахуй", "сука", "блять", "блять", "это", "оно", "там", "тут",
    "взял", "взяла", "выдуманн", "почему", "откуда", "какой", "какая",
    "какие", "забыл", "нужно", "надо", "здесь", "опять", "снова", "буду",
}

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _recent_boris(lines, n=8):
    out = []
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "user" or o.get("isMeta"):
            continue
        c = (o.get("message", {}) or {}).get("content")
        text = ""
        if isinstance(c, str):
            text = c
        elif isinstance(c, list):
            if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                continue
            text = " ".join(
                b.get("text", "") for b in c
                if isinstance(b, dict) and b.get("type") == "text"
            )
        text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S).strip()
        if not text or any(m in text for m in SERVICE_MARKERS):
            continue
        out.append(text)
        if len(out) >= n:
            break
    return out


def _tokens(joined):
    toks = set()
    for m in TOKEN_RE.finditer(joined):
        for g in m.groups():
            if not g:
                continue
            g = g.lower()
            if g in STOP or len(g) < 4:
                continue
            toks.add(g)
    return toks


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if not fp.endswith("lib/services-pages.ts"):
        return None
    old = str(ti.get("old_string", "")).lower()
    new = str(ti.get("new_string", "") or ti.get("content", "")).lower()
    if not old:
        return None
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    boris = _recent_boris(lines)
    if not boris:
        return None
    joined = " ".join(boris)
    if not SRC_Q_RE.search(joined):
        return None            # Boris не спрашивал про источник
    if DELETE_CMD_RE.search(joined):
        return None            # есть явная команда удалить/заменить — разрешаем
    toks = _tokens(joined)
    if not toks:
        return None
    removed = []
    for t in toks:
        stem = t[:6]
        if stem in old and stem not in new:
            removed.append(t)
    if not removed:
        return None
    word = removed[0]
    return (
        f"БЛОК check_justify_not_delete: Boris поставил под вопрос ИСТОЧНИК слова "
        f"«{word}» (обоснуй/откуда/какой нахуй), но команды УДАЛИТЬ не давал. "
        f"Ты выкидываешь «{word}» из копи — это опять прыжок в удаление вместо "
        f"объяснения. СТОП: сначала ОБОСНУЙ в чате откуда «{word}» (источник в "
        f"коде/калькуляторе/позиционировании), и дождись явного «убери/удали/замени». "
        f"Только тогда правь."
    )


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
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
