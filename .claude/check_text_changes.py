"""Stop hook — блокирует завершение ответа, если в этом turn был Edit/Write
по файлу с русскими клиентскими текстами, но в ответе нет чек-листа вычитки.

Цель: заставить меня публично подтверждать вычитку каждый раз, когда правлю
FAQ/секцию лендинга/PDF/email/блог — а не молча запушивать опечатки.
"""
import json
import re
import sys
from pathlib import Path


RUSSIAN_TEXT_FILES = re.compile(
    r"(?:^|/)("
    r"lib/faqs\.ts|"
    r"lib/chat-system-prompt\.ts|"
    r"lib/calculator-system-prompt\.ts|"
    r"lib/calculator-pdf\.tsx|"
    r"lib/metadata\.ts|"
    r"components/(?:sections|blog|shared)/[^/]+\.tsx|"
    r"app/.+\.(?:tsx|mdx)|"
    r"app/api/(?:calculator|lead|chat)/[^/]+\.ts|"
    r"content/blog/.+\.mdx"
    r")",
    re.IGNORECASE,
)
CHECKLIST_RE = re.compile(
    r"вычитал|чек.?лист|орфограф|пунктуац|✓|✅",
    re.IGNORECASE,
)
EDIT_TOOLS = {"Edit", "Write", "NotebookEdit"}


def _last_turn(transcript_path: str):
    """Возвращает (text, edited_files) для последнего assistant turn."""
    p = Path(transcript_path)
    if not p.exists():
        return "", []
    lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()

    last_user_idx = -1
    for i, line in enumerate(lines):
        try:
            msg = json.loads(line)
        except Exception:
            continue
        if msg.get("type") == "user":
            last_user_idx = i

    if last_user_idx == -1:
        return "", []

    text_parts = []
    edited_files = []
    for line in lines[last_user_idx + 1:]:
        try:
            msg = json.loads(line)
        except Exception:
            continue
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if isinstance(content, str):
            text_parts.append(content)
        elif isinstance(content, list):
            for block in content:
                btype = block.get("type")
                if btype == "text":
                    text_parts.append(block.get("text", ""))
                elif btype == "tool_use":
                    name = block.get("name", "")
                    if name in EDIT_TOOLS:
                        path = block.get("input", {}).get("file_path", "")
                        if path:
                            edited_files.append(path.replace("\\", "/"))
    return "\n".join(text_parts), edited_files


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

    text, edited_files = _last_turn(transcript_path)

    edited_russian = [f for f in edited_files if RUSSIAN_TEXT_FILES.search(f)]
    if not edited_russian:
        sys.exit(0)

    if CHECKLIST_RE.search(text):
        sys.exit(0)

    files_list = "\n".join(f"  - {f}" for f in edited_russian)
    reason = (
        f"В этом turn внесены правки в файлы с русскими клиентскими текстами:\n"
        f"{files_list}\n\n"
        "Перед завершением ответа выведи чек-лист вычитки в одну строку:\n"
        "«Вычитал на: запятые после вводных и перед чем/что/если ✓; "
        "согласование падежей и числительных (1-2 часов, для X и Y) ✓; "
        "запрещённая «ё» ✓; запрещённые слова (AI-стек, алерт, крипта, вайб-кодинг) ✓; "
        "внутренние противоречия (заморозить vs не переносится) ✓.»\n\n"
        "См. feedback_proofread_always.md и feedback_text_consistency.md."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()
