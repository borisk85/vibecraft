"""PreToolUse hook — если Boris ПРОДИКТОВАЛ точный текст копи, вставка обязана
содержать его ДОСЛОВНО. Блок, если правка теряет хоть одно слово из диктовки.

Класс ошибки (08.07, forWhom mobilnye): Boris дал точный текст «Стартапам,
индивидуальным предпринимателям и бизнесу, которым нужно проверить идею
приложения...», а я вставил хвост, склеенный с СОСЕДНЕЙ страницы («малому и
среднему бизнесу и компаниям...»), потеряв его слова «индивидуальным
предпринимателям». check_no_invented_copy пропустил — совпал общий кусок.

Механизм: правка длинной русской копи в services-pages.ts. Берём последние
сообщения Boris, ищем блок-диктовку, максимально пересекающийся со вставкой
(overlap >= 0.5 = это ТА САМАЯ строка, что он диктовал). Если в его блоке есть
значимые слова (>=5 букв, не служебные), которых НЕТ во вставке — БЛОК с
перечнем потерянных слов: вставляй его текст дословно.
"""
import json
import re
import sys

STOP = {
    "которым", "которые", "которых", "которого", "которой", "нужно", "чтобы",
    "вашу", "ваших", "вашего", "вашем", "ваша", "этот", "если", "или", "при",
    "для", "под", "над", "без", "как", "так", "все", "его", "они", "вам", "вас",
    "это", "того", "будет", "есть", "быть", "свои", "свою", "своей", "также",
    "очень", "можно", "более", "менее", "этом", "этой", "эти", "уже", "там",
    "тут", "чтоб", "весь", "всех", "всем",
}

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _words(s):
    return re.findall(r"[а-яёa-z0-9]{2,}", s.lower())


def _content(words):
    return [w for w in words if len(w) >= 5 and w not in STOP]


def _recent_boris(lines, n=4):
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
    new_text = str(ti.get("new_string", "") or ti.get("content", ""))
    new_words = set(_words(new_text))
    if len(re.findall(r"[а-яё]", new_text)) < 40:
        return None
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    best = None  # (overlap, missing, block_content_len)
    for msg in _recent_boris(lines):
        # разбиваем сообщение на строки-кандидаты диктовки
        for block in re.split(r"[\n\r]+", msg):
            bc = _content(_words(block))
            if len(bc) < 4:
                continue
            present = [w for w in bc if w in new_words]
            overlap = len(present) / len(bc)
            missing = [w for w in bc if w not in new_words]
            if overlap >= 0.5 and missing:
                if best is None or overlap > best[0]:
                    best = (overlap, missing, len(bc))
    if not best:
        return None
    lost = ", ".join(f"«{w}»" for w in best[1][:6])
    return (
        "БЛОК check_verbatim_dictation: Boris продиктовал точный текст этой строки, "
        f"а твоя вставка ТЕРЯЕТ его слова: {lost}. Это класс ошибки forWhom mobilnye "
        "(склеил с соседней страницы вместо его текста). СТОП: вставь текст Boris'а "
        "ДОСЛОВНО, слово в слово, без подмены с других страниц и без своих вариантов."
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
