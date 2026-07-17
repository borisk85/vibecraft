"""PreToolUse hook — тумблер против запрещённых фраз согласия/самобичевания
(«ты прав / я виноват / согласен / справедливо / это на мне») в ПОДВОДКЕ перед
инструментом.

Почему нужен вдобавок к Stop-хуку check_no_ty_prav: Stop-хук ловит фразу только
в момент завершения хода. Если я пишу «ты прав» в промежуточной строке ПЕРЕД
вызовом инструмента, она уже показана Boris, а Stop сработает лишь в конце.
Этот хук проверяет ПОСЛЕДНЕЕ моё текстовое сообщение при КАЖДОМ вызове
инструмента и блокирует продолжение — чтобы фраза ловилась на первой же границе
и не тянулась через весь ход. Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

TY_PRAV_RE = re.compile(
    r"(ты\s+прав\b|ты\s+права\b|ты\s+прав[,.—-]|\bправ\s+ты\b|"
    r"твоя\s+правда|тут\s+ты\s+прав|по\s+факту\s+прав|"
    r"\bсоглас(?:ен|на|усь|и?тесь)\b|\bсправедливо\b|"
    r"я\s+виноват\w*|моя\s+вина|\bвиноват\b|"
    r"это\s+на\s+мне|на\s+мне,?\s+не\s+на\s+теб)",
    re.IGNORECASE | re.UNICODE,
)

META_RE = re.compile(
    r"(хук|правил|запрет|запрещ|блокир|ловит|срабат|фраз|стоп.?лист|"
    r"класс\s+запрещ|тумблер|подводк)",
    re.IGNORECASE | re.UNICODE,
)


def _last_assistant_text(lines):
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if parts:
            return "\n".join(parts)
    return ""


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if "/.claude/" in fp:
        return None  # правки самих хуков не гейтим
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    text = _last_assistant_text(lines)
    if not text.strip():
        return None
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    for m in TY_PRAV_RE.finditer(clean):
        s = clean.rfind(".", 0, m.start())
        s = s + 1 if s != -1 else 0
        e = clean.find(".", m.end())
        e = e if e != -1 else len(clean)
        if META_RE.search(clean[s:e]):
            continue
        return (
            f"БЛОК check_no_selfagree_pretool: в твоей подводке перед инструментом "
            f"запрещённая фраза «{m.group(0)}». Boris запретил «ты прав / согласен / "
            "виноват / справедливо / это на мне» НАВСЕГДА. Не пиши подтверждений-"
            "согласий перед действием: на поправку — сразу инструмент без текстовой "
            "подводки, либо нейтральное слово. Перепиши ход без этой фразы."
        )
    return None


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
