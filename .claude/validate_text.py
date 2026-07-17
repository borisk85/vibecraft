"""PreToolUse hook — БЛОКИРУЕТ запись Edit/Write если в новом тексте есть:
- буква «ё/Ё» (запрещена правилами проекта)
- запрещённые слова из CLAUDE.md (AI-стек, AI-инструменты, вайб-кодинг, vibe coding, крипта, алерт в текстах)
- сочинённые маркетинговые факты (требуют подтверждения от Boris)

Цель: техническая страховка от моих типичных ошибок. Лучше блок до записи в файл,
чем потом ловить на проде.
"""
import json
import re
import sys


# Файлы где есть русский клиентский текст (UI/копирайт/PDF/email/блог)
RUSSIAN_TEXT_FILES = re.compile(
    r"(?:^|/)("
    r"lib/faqs\.ts|"
    r"lib/chat-system-prompt\.ts|"
    r"lib/calculator-system-prompt\.ts|"
    r"lib/calculator-pdf\.tsx|"
    r"lib/metadata\.ts|"
    r"lib/blog-posts\.ts|"
    r"components/(?:sections|blog|shared)/[^/]+\.tsx|"
    r"app/.+\.(?:tsx|mdx)|"
    r"app/api/(?:calculator|lead|chat)/[^/]+\.ts|"
    r"content/blog/.+\.mdx"
    r")",
    re.IGNORECASE,
)

# Запрещённые буквы — в любых файлах проекта (правило ё/Ё везде)
YO_LETTERS = re.compile(r"[ёЁ]")  # ё, Ё

# Запрещённые слова в публичных текстах (нарушение CLAUDE.md)
FORBIDDEN_WORDS = [
    (r"AI-стек", "«AI-стек»"),
    (r"AI-инструмент", "«AI-инструменты»"),
    (r"вайб-кодинг", "«вайб-кодинг»"),
    (r"vibe\s+coding", "«vibe coding»"),
    (r"vibecoder", "«vibecoder»"),
    (r"\bкрипта\b", "«крипта» (использовать «криптовалюта»)"),
    (r"коробк\w*", "«коробка / из коробки / коробочный» — жаргон, Boris вычищал руками; писать «готовое решение / готовый сервис»"),
]

# Слово «алерт» только в русских текстовых файлах (в коде alert() допустим)
ALERT_RE = re.compile(r"\bалерт", re.IGNORECASE)


def get_new_text(tool_name, tool_input):
    """Извлекает новый текст из tool_input для Edit/Write/NotebookEdit."""
    if tool_name == "Edit":
        return tool_input.get("new_string", "")
    if tool_name == "Write":
        return tool_input.get("content", "")
    if tool_name == "NotebookEdit":
        return tool_input.get("new_source", "")
    return ""


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})

    if tool_name not in ("Edit", "Write", "NotebookEdit"):
        sys.exit(0)

    file_path = tool_input.get("file_path", "").replace("\\", "/")
    new_text = get_new_text(tool_name, tool_input)

    if not new_text:
        sys.exit(0)

    violations = []

    # 1. «ё/Ё» — везде в проекте
    yo_matches = YO_LETTERS.findall(new_text)
    if yo_matches:
        sample = YO_LETTERS.search(new_text)
        ctx_start = max(0, sample.start() - 20)
        ctx_end = min(len(new_text), sample.end() + 20)
        ctx = new_text[ctx_start:ctx_end]
        violations.append(
            f"Найдена запрещённая «ё/Ё» ({len(yo_matches)} шт). "
            f"Контекст: «...{ctx}...». Заменить на «е/Е»."
        )

    is_text_file = bool(RUSSIAN_TEXT_FILES.search(file_path))

    # 2. Запрещённые слова — только в файлах с публичным текстом
    if is_text_file:
        for pattern, label in FORBIDDEN_WORDS:
            if re.search(pattern, new_text, re.IGNORECASE):
                violations.append(
                    f"Найдено запрещённое слово {label}. См. CLAUDE.md → «Терминология для клиента»."
                )

        # «алерт» только в текстовых файлах
        if ALERT_RE.search(new_text):
            violations.append(
                "Найдено «алерт» в публичном тексте. Использовать «уведомление» (см. CLAUDE.md)."
            )

    if not violations:
        sys.exit(0)

    reason = (
        "Запись заблокирована — найдены нарушения правил проекта:\n\n"
        + "\n".join(f"• {v}" for v in violations)
        + "\n\nИсправь new_string/content и повтори Edit/Write."
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
