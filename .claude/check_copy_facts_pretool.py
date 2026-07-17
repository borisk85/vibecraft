"""PreToolUse hook — защита от ОТСЕБЯТИНЫ в копи (маркетинг/факты о продукте).

Класс ошибки (14.07): в копи сайта/блога/бота я вставил утверждение
«данные не уходят на чужие серверы» — фактически ЛОЖЬ (данные идут на Anthropic
для обработки Claude). Разошлось по всему сайту, Boris в ярости: «почему копи
пишутся отсебятиной?!». Любое фактическое утверждение о том, КАК работает продукт,
о приватности/безопасности, о сравнении с конкурентами — должно быть подтверждено
кодом / Privacy Policy / ресёрчем, НЕ выдумано.

Хук гейтит Edit/Write в файлы копи: если new_string/content содержит фактические
маркеры (приватность, безопасность, сравнение конкурентов, модели, цифры-обещания)
и в ПОДВОДКЕ перед инструментом нет пометки факт-чека — блокирует. Чтобы пройти:
в тексте перед Edit написать «факт-чек: <источник>» (код/Privacy Policy/ресёрч/grep),
подтвердив, что каждое утверждение проверено, а не сочинено.

Правки самих хуков (.claude/) не гейтим.
"""
import json
import re
import sys

# Файлы, которые видит юзер как копи vibecraft (лендинг/блог/услуги/чат-виджет/PDF)
COPY_PATH_RE = re.compile(
    r"(blog-posts\.ts|lib/services-pages\.ts|lib/faqs\.ts|lib/metadata\.ts|"
    r"chat-system-prompt\.ts|calculator-system-prompt\.ts|"
    r"/components/sections/|/components/blog/|/components/shared/|"
    r"content/blog/|app/.+\.(?:tsx|mdx)|api/chat/route\.ts|"
    r"llms\.txt|/privacy/|/terms/|/about/)",
    re.IGNORECASE,
)

# Фактические утверждения, которые НЕЛЬЗЯ выдумывать.
# Для vibecraft ключевое: приватность/безопасность данных (инцидент «данные не
# уходят на чужие серверы» — ложь, данные идут в Anthropic) и сравнительные
# claim'ы «дешевле / в N раз / быстрее чем студия» (CLAUDE.md прямо запрещает вести
# маркетинг на дешевизне и сочинять сравнения со студиями).
FACT_RE = re.compile(
    r"(не\s+переда|не\s+уход|зашифр|на\s+серверах|чуж\w*\s+сервер|"
    r"outside\s+server|never\s+shared|not\s+shared|"
    r"безопасн|приватн|третьим\s+лиц|third\s+part|"
    r"дешевле|быстрее\s+чем|надежнее|в\s+\d+\s*раз\w*\s+(?:дешевле|быстрее|деш|быстр)|"
    r"под\s+капотом|under\s+the\s+hood|"
    r"утечк|leak|юрисдикц|jurisdiction)",
    re.IGNORECASE | re.UNICODE,
)

# Пометки факт-чека в подводке — снимают блок
EXEMPT_RE = re.compile(
    r"(факт-?чек|факт\s*чек|проверено:|источник:|по\s+код|из\s+код|"
    r"grep\s+подтверд|подтвержд\w*\s+код|privacy\s+policy|по\s+юридик|"
    r"рес[её]рч\w*\s+подтверд|websearch|подтвержд\w*\s+рес[её]рч|"
    r"из\s+privacy|согласован\w*\s+с\s+юридик)",
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
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if "/.claude/" in fp.lower():
        return None
    if not COPY_PATH_RE.search(fp):
        return None
    # что именно вставляется
    payload = str(ti.get("new_string", "")) + "\n" + str(ti.get("content", ""))
    if not FACT_RE.search(payload):
        return None
    tp = data.get("transcript_path")
    lead = ""
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                lead = _last_assistant_text(f.read().splitlines())
        except Exception:
            lead = ""
    if EXEMPT_RE.search(lead):
        return None
    return (
        "БЛОК check_copy_facts: в копи вставляется фактическое утверждение о "
        "продукте/приватности/конкурентах, но в подводке НЕТ факт-чека. Класс ошибки "
        "«данные не уходят на чужие серверы» = ложь, разошлась по сайту. ЗАПРЕЩЕНО "
        "сочинять копи. Проверь КАЖДОЕ утверждение по источнику (код / Privacy Policy / "
        "ресёрч WebSearch / grep) и в тексте перед Edit напиши «факт-чек: <источник>» — "
        "только тогда вставляй. Если не можешь подтвердить фактом — НЕ пиши это в копи."
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
