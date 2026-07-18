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
    r"(ты\s+прав\b|ты\s+права\b|ты\s+прав\s*[,.—–-]|\bправ\s+ты\b|"
    # одиночное «Прав,»/«Прав.»/«Прав —»/«Прав.» как согласие (без «ты»).
    # \s* ОБЯЗАТЕЛЕН: «Прав —» (пробел перед тире) проскочило 17.07 — старый
    # \bправ[...] требовал пунктуацию вплотную и пробел+тире не ловил.
    # ASCII-дефис «-» УБРАН из класса: он ложно ловил составные «compound-хук» через
    # дефис (баг 18.07). Тире-согласие ловим только em/en-dash (—–) и знаки конца фразы.
    r"\bправ\s*[,.!;:—–]|"
    r"твоя\s+правда|тут\s+ты\s+прав|по\s+факту\s+прав|ткнул\s+по\s+делу|по\s+делу\s+ткнул|"
    # поддакивание/самобичевание — тот же класс, ловим тоже
    r"\bсоглас(?:ен|на|усь|и?тесь)\b|\bсправедливо\b|"
    r"я\s+виноват\w*|моя\s+вина|\bвиноват\b|"
    r"логика\s+(?:на\s+тво|тво)|на\s+тво[её]й\s+сторон|"
    # приём слов Boris как источника истины = то же поддакивание
    r"по\s+тво[ейёя]+\s+(?:поправк|словам|коррект|замечани)|принял\s+тво|"
    r"тво[яейё]+\s+(?:поправк|правк)\w*\s+(?:вер|прав)|верным\w*\s+определени|"
    # запрещённое самобичевание-фраза (Boris запретил навсегда)
    r"это\s+на\s+мне|на\s+мне,?\s+не\s+на\s+теб|не\s+на\s+теб\w*|не\s+на\s+мен\w*|"
    r"это\s+на\s+теб\w*|на\s+моей\s+работе|это\s+на\s+работе|"
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
    # не проверять код-блоки и инлайн-код (там могу цитировать запрет легитимно)
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    # ЕДИНСТВЕННОЕ исключение: САМА запрещённая фраза заключена в «ёлочки» —
    # это прямая цитата запрета («запрещено „ты прав“»), а не согласие.
    # Широкий мета-фильтр по словам (хук/фраза/правило) и «есть любые ёлочки в
    # предложении» УБРАНЫ — они глотали реальные «ты прав», когда рядом случайно
    # было «хук»/«лажа» или цитата ДРУГОГО текста в «ёлочках» (дыра 17.07,
    # проскочило «ты прав, «менять смысла нет» была лажа»).
    quote_spans = [(mo.start(), mo.end()) for mo in re.finditer(r"«[^»]*»", clean)]
    for m in TY_PRAV_RE.finditer(clean):
        if any(qs <= m.start() and m.end() <= qe for qs, qe in quote_spans):
            continue  # цитата запрета внутри самих «ёлочек» — не согласие
        return m
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    # PreToolUse БЕЗ белого списка инструментов: если в последней текстовой реплике
    # уже есть «ты прав» — режем ЛЮБОЙ следующий инструмент (Edit/Bash/TodoWrite и
    # т.д.), чтобы фраза ловилась на первой же границе, а не только в самом конце
    # хода. Старый SAFE_PRETOOL глушил проверку почти для всех инструментов — из-за
    # него PreToolUse-ветка не блокировала ничего (дыра 17.07).
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
