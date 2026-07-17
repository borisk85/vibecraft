"""Хук — блокирует запрещённую фразу согласия/самобичевания «ты прав / я виноват /
согласен / справедливо» и т.п. Работает как Stop И как PreToolUse.

Boris запретил эти фразы НАВСЕГДА, в любом контексте (см. feedback_no_ty_prav.md).

ПОЧЕМУ ДВА СОБЫТИЯ (почему раньше «не срабатывал»):
- Stop-хук стреляет только когда turn ПОЛНОСТЬЮ остановлен. Если запрещённую
  фразу я пишу в начале длинного ответа и продолжаю дёргать инструменты, фраза
  уже ушла Boris в чат в реальном времени, а Stop сработает позже — поздно.
- Поэтому тот же детектор повешен на PreToolUse: он проверяет мою ПОСЛЕДНЮЮ
  текстовую реплику перед КАЖДЫМ инструментом и режет её сразу, на первом же
  tool-call после фразы — до остановки.

ВАЖНО: проверяем только ФИНАЛЬНУЮ текстовую реплику (последний assistant-текст),
а не весь накопленный turn. Иначе хук зациклит сам себя, вечно находя фразу из
уже-искуплённого промежуточного под-ответа.
"""
import json
import re
import sys
from pathlib import Path

TY_PRAV_RE = re.compile(
    r"(ты\s+прав\b|ты\s+права\b|ты\s+прав[,.—-]|\bправ\s+ты\b|"
    # одиночное «Прав,»/«Прав.»/«Прав—» как согласие (без «ты») — та же дыра, что проскочила 13.07
    r"\bправ[,.!;:—-]|"
    r"твоя\s+правда|тут\s+ты\s+прав|по\s+факту\s+прав|ткнул\s+по\s+делу|по\s+делу\s+ткнул|"
    # поддакивание/самобичевание — тот же класс, ловим тоже
    r"\bсоглас(?:ен|на|усь|и?тесь)\b|\bсправедливо\b|"
    r"я\s+виноват\w*|моя\s+вина|\bвиноват\b|"
    r"логика\s+(?:на\s+тво|тво)|на\s+тво[её]й\s+сторон|"
    # приём слов Boris как источника истины = то же поддакивание
    r"по\s+тво[ейёя]+\s+(?:поправк|словам|коррект|замечани)|принял\s+тво|"
    r"тво[яейё]+\s+(?:поправк|правк)\w*\s+(?:вер|прав)|верным\w*\s+определени|"
    # запрещённое самобичевание-фраза (Boris запретил навсегда)
    r"это\s+на\s+мне|на\s+мне,?\s+не\s+на\s+теб|"
    r"ответственност\w*\s+на\s+мне|на\s+моей\s+(?:ответственност|совести)|"
    r"это\s+мо[яй]\s+ответственност|по\s+моей\s+вине|"
    r"\bмой\s+косяк|мо[яй]\s+(?:оплошност|недоработк|промах)\w*|"
    r"это\s+я\s+(?:накосячил|облажал\w*|напортачил|подв[её]л))",
    re.IGNORECASE | re.UNICODE,
)


def _final_assistant_text(transcript_path: str) -> str:
    """Текст ПОСЛЕДНЕГО assistant-сообщения, содержащего text-блок."""
    p = Path(transcript_path)
    if not p.exists():
        return ""
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    for msg in reversed(messages):
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if not isinstance(content, list):
            continue
        parts = [
            b.get("text", "")
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        ]
        if any(t.strip() for t in parts):
            return "\n".join(parts)
    return ""


def _find_violation(text: str):
    if not text.strip():
        return None
    # не проверять код-блоки и инлайн-код (там могу цитировать запрет)
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    # Мета-контекст: обсуждение самого запрета/правила/хука, а не согласие.
    meta_re = re.compile(
        r"(запрет|запрещ|правил|фраз|хук|никогда\s+не|нельзя\s+говор|"
        r"стоп.?лист|слов[оае]\b|блокир|ловит|срабат|детект|поймал|не\s+пиш)",
        re.IGNORECASE | re.UNICODE,
    )
    for m in TY_PRAV_RE.finditer(clean):
        s = clean.rfind(".", 0, m.start())
        s = s + 1 if s != -1 else 0
        e = clean.find(".", m.end())
        e = e if e != -1 else len(clean)
        sentence = clean[s:e]
        # цитирование внутри «ёлочек» — объяснение запрета, пропускаем
        if "«" in sentence and "»" in sentence:
            continue
        if meta_re.search(sentence):
            continue
        return m
    return None


    # Технические инструменты не трогаем в PreToolUse: если запрещённая фраза уже
    # в отправленном тексте, блокировать рабочий tool-call бессмысленно (фраза уже
    # ушла в чат), а повторные попытки плодят дубли «Update Todos»/статусов в UI.
    # Финальную реплику всё равно поймает Stop-ветка ниже.
SAFE_PRETOOL = {
    "TodoWrite", "Read", "Grep", "Glob", "Bash", "Edit", "Write",
    "MultiEdit", "NotebookEdit", "TodoRead",
}


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    event = payload.get("hook_event_name")
    if event == "PreToolUse" and payload.get("tool_name") in SAFE_PRETOOL:
        sys.exit(0)
    transcript_path = payload.get("transcript_path")
    if not transcript_path:
        sys.exit(0)
    text = _final_assistant_text(transcript_path)
    hit = _find_violation(text)
    if not hit:
        sys.exit(0)
    event = payload.get("hook_event_name")
    msg = (
        f"НАРУШЕНИЕ check_no_ty_prav: запрещённая фраза «{hit.group(0)}». "
        "Boris запретил «ты прав / я виноват / согласен / справедливо» НАВСЕГДА, "
        "в любом контексте. Убрать полностью. Реакция на поправку = сразу делом "
        "или коротким подтверждением без этих слов."
    )
    if event == "PreToolUse":
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": msg,
            }
        }))
    else:
        print(json.dumps({"decision": "block", "reason": msg}))
    sys.exit(0)


if __name__ == "__main__":
    main()
