"""UserPromptSubmit hook — подмешивает жесткие правила vibecraft в контекст перед каждым ответом."""
import json
from pathlib import Path

MEMORY_DIR = Path(r"C:/Users/bkoma/.claude/projects/c--Claude-Code-vibecraft/memory")
FILES = [
    "feedback_proofread_always.md",
    "feedback_text_consistency.md",
    "feedback_pricing_highlight.md",
    "feedback_style_changes.md",
    "feedback_writing_style.md",
    "feedback_public_terminology.md",
    "feedback_gradient_usage.md",
]

parts = []
for fname in FILES:
    p = MEMORY_DIR / fname
    if p.exists():
        parts.append(f"=== {fname} ===\n{p.read_text(encoding='utf-8')}")

header = "## Жесткие правила vibecraft (auto-injected перед каждым ответом — нарушение = баг):\n\n"
content = header + "\n\n".join(parts)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": content
    }
}))
